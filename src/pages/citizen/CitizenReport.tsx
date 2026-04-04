import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import BottomNav from "@/components/BottomNav";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Camera, MapPin, Check, Loader2, ArrowLeft, ArrowRight, Upload } from "lucide-react";
import { issueCategories, departments, CivicIssue } from "@/lib/types";
import { useAuth } from "@/lib/authContext";
import { createIssue } from "@/lib/firestore";
import { uploadToCloudinary } from "@/lib/cloudinary";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import SparkleButton from "@/components/SparkleButton";
import IssueMap from "@/components/IssueMap";

const steps = ["Location", "Capture", "Details", "Submit"];

// Map category to department
const categoryDepartmentMap: Record<string, string> = {
  "Pothole": departments[0],
  "Road Blockage": departments[0],
  "Garbage Overflow": departments[4],
  "Drainage Overflow": departments[2],
  "Water Leakage": departments[1],
  "Electric Cable Issue": departments[3],
  "Streetlight Damage": departments[6],
  "Ambulance Blockage": departments[5],
};

const CitizenReport = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationError, setLocationError] = useState("");
  const [locating, setLocating] = useState(false);
  const [photoTaken, setPhotoTaken] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const submittingRef = useRef(false); // Prevent race condition on double-tap
  // Keep a ref in sync with cameraStream so stopCamera can always see the
  // latest stream without needing to be re-created on every render.
  const cameraStreamRef = useRef<MediaStream | null>(null);

  const stopCamera = useCallback(() => {
    if (cameraStreamRef.current) {
      cameraStreamRef.current.getTracks().forEach((t) => t.stop());
      cameraStreamRef.current = null;
      setCameraStream(null);
    }
  }, []);

  const startCamera = useCallback(async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("INSECURE_CONTEXT");
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
        audio: false,
      });
      cameraStreamRef.current = stream;
      setCameraStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err: any) {
      console.error("Camera fail:", err);
      let errMsg = "Unknown camera error";
      if (err.message === "INSECURE_CONTEXT") {
         errMsg = "Browser blocked camera. You must be on HTTPS or 'localhost' to access hardware.";
      } else if (err.name === "NotAllowedError") {
         errMsg = "You denied browser camera permissions.";
      } else if (err.name === "NotFoundError") {
         errMsg = "No physical camera detected on this device.";
      } else {
         errMsg = err.message || "Failed to start hardware camera.";
      }
      setCameraError(errMsg);
      toast.error(errMsg);
    }
  }, []);

  const handleGetLocation = async () => {
    setLocating(true);
    setLocationError("");

    const tryFallback = async () => {
      try {
        const res = await fetch("https://get.geojs.io/v1/ip/geo.json");
        const data = await res.json();
        if (data.latitude && data.longitude) {
           setLocation({ lat: parseFloat(data.latitude), lng: parseFloat(data.longitude) });
           setLocating(false);
           setStep(1);
           toast.success("Location acquired via network");
           return;
        }
      } catch (e) {
        console.error("IP Fallback err:", e);
      }
      setLocationError("Unable to retrieve your location through GPS or Network. Please check permissions.");
      setLocating(false);
    };

    if (!navigator.geolocation) {
      await tryFallback();
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({ lat: position.coords.latitude, lng: position.coords.longitude });
        setLocating(false);
        setStep(1);
        toast.success("Location acquired successfully");
      },
      async (err) => {
        console.warn(`Browser Geo failed (code ${err.code}):`, err.message);
        await tryFallback();
      },
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 300000 }
    );
  };

  useEffect(() => {
    if (step === 1 && !photoTaken && !cameraError) {
      void startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [step, photoTaken, cameraError, startCamera, stopCamera]);

  const compressAndSet = async (imageSource: HTMLImageElement | HTMLVideoElement, width: number, height: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Step 1: Resize — cap longest edge at 1024px (good enough for civic reports)
    const MAX_DIM = 1024;
    let w = width, h = height;
    if (w > h && w > MAX_DIM) { h = Math.round(h * MAX_DIM / w); w = MAX_DIM; }
    else if (h > MAX_DIM) { w = Math.round(w * MAX_DIM / h); h = MAX_DIM; }
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(imageSource, 0, 0, w, h);

    // Step 2: Adaptive quality — keep halving quality until output ≤ 150 KB
    const TARGET_BYTES = 150 * 1024; // 150 KB
    let quality = 0.75;
    let dataUrl = canvas.toDataURL("image/jpeg", quality);

    // Each base64 char ≈ 0.75 bytes; subtract the data:image/jpeg;base64, prefix
    const byteLength = (b64: string) => Math.round((b64.length - 22) * 0.75);

    while (byteLength(dataUrl) > TARGET_BYTES && quality > 0.15) {
      quality = Math.max(quality - 0.1, 0.15);
      dataUrl = canvas.toDataURL("image/jpeg", quality);
    }

    const finalKB = Math.round(byteLength(dataUrl) / 1024);

    setPhotoPreview(dataUrl);
    setPhotoTaken(true);
    stopCamera();
    toast.success(`Photo captured · ${finalKB} KB`);
    setTimeout(() => setStep(2), 600);
  };

  const capturePhoto = () => {
    if (!videoRef.current || !cameraStreamRef.current) {
      toast.error("Camera not ready. Please try again.");
      return;
    }
    const video = videoRef.current;
    void compressAndSet(video, video.videoWidth || 640, video.videoHeight || 480);
  };

  const retakePhoto = () => {
    setPhotoTaken(false);
    setPhotoPreview(null);
    setCameraError(null);
  };

  const handleSubmit = async () => {
    // Race condition guard — prevent double-tap submissions
    if (submittingRef.current) return;
    if (!selectedCategory || !location || !user) {
      toast.error("Missing required information");
      return;
    }
    submittingRef.current = true;
    setSubmitting(true);

    try {
      let finalImageUrl = "";

      if (photoPreview) {
        try {
          // Convert dataURL to blob and upload to Firebase Storage
          const res = await fetch(photoPreview);
          const blob = await res.blob();
          finalImageUrl = await uploadToCloudinary(blob);
        } catch (uploadErr: any) {
          console.error("Cloudinary upload fail:", uploadErr);
          toast.error("Image upload failed. Submitting report anyway.");
        }
      }

      const newIssue: Omit<CivicIssue, "id" | "reportedAt"> = {
        title: selectedCategory,
        description,
        category: selectedCategory,
        location: `${location.lat.toFixed(5)}, ${location.lng.toFixed(5)}`,
        lat: location.lat,
        lng: location.lng,
        status: "open",
        severity: "medium",
        department: categoryDepartmentMap[selectedCategory] ?? "General",
        reportCount: 1,
        ward: user.ward ?? "",
        userId: user.uid,
        imageUrl: finalImageUrl,
        timeline: [{ label: "Issue reported", date: new Date().toISOString(), done: true }],
      };

      await createIssue(newIssue);
      toast.success("Report submitted successfully!");
      navigate("/citizen/my-reports");
    } catch (error) {
      console.error("Submission error", error);
      toast.error("Failed to submit report. Please try again.");
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <div 
        className="gradient-primary px-5 pb-6 rounded-b-3xl"
        style={{ paddingTop: 'calc(var(--safe-area-top, 0px) + 2.5rem)' }}
      >
        <h1 className="font-display text-xl font-bold text-primary-foreground">Report Issue</h1>
        <p className="text-sm text-primary-foreground/70 mt-1">Help improve your community</p>
      </div>

      {/* Step indicator */}
      <div className="px-5 mt-6 mb-6">
        <div className="flex items-center justify-between">
          {steps.map((s, i) => (
            <div key={s} className="flex items-center">
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold border-2 transition-all",
                i <= step
                  ? "gradient-primary text-primary-foreground border-primary"
                  : "border-border text-muted-foreground bg-muted"
              )}>
                {i < step ? <Check className="w-4 h-4" /> : i + 1}
              </div>
              {i < steps.length - 1 && (
                <div className={cn("w-12 h-0.5 mx-1", i < step ? "bg-primary" : "bg-border")} />
              )}
            </div>
          ))}
        </div>
        <div className="flex justify-between mt-1">
          {steps.map((s) => (
            <span key={s} className="text-[10px] text-muted-foreground">{s}</span>
          ))}
        </div>
      </div>

      <div className="px-5">
        <AnimatePresence mode="wait">
          {/* Step 0 — Location */}
          {step === 0 && (
            <motion.div key="location" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <div className="bg-card border border-border rounded-2xl p-8 flex flex-col items-center justify-center min-h-[300px]">
                <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-4">
                  <MapPin className="w-10 h-10 text-primary" />
                </div>
                <h3 className="font-display font-semibold text-foreground mb-2">Access Location</h3>
                <p className="text-sm text-muted-foreground text-center mb-6">
                  We need your exact location to tag the civic issue accurately.
                </p>
                {locationError && <p className="text-xs text-destructive mb-4 text-center">{locationError}</p>}
                <SparkleButton onClick={handleGetLocation} disabled={locating} className="gradient-primary text-primary-foreground h-10 px-4 py-2 rounded-md">
                  {locating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <MapPin className="w-4 h-4 mr-2" />}
                  {locating ? "Locating..." : "Get Location"}
                </SparkleButton>
              </div>
            </motion.div>
          )}

          {/* Step 1 — Capture */}
          {step === 1 && (
            <motion.div key="capture" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <div className="bg-card border border-border rounded-2xl p-6 flex flex-col items-center min-h-[300px]">
                {!photoTaken ? (
                  <>
                    {!cameraError ? (
                      <>
                        <h3 className="font-display font-semibold text-foreground mb-4 self-start">Take a Photo</h3>
                        <div className="relative w-full aspect-video bg-black rounded-xl overflow-hidden mb-4 border border-border">
                          <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                          <canvas ref={canvasRef} className="hidden" />
                        </div>
                        <div className="flex gap-3 w-full justify-center">
                          <SparkleButton onClick={capturePhoto} className="gradient-primary text-primary-foreground h-10 px-8 py-2 rounded-md">
                            <Camera className="w-4 h-4 mr-2" /> Capture Photo
                          </SparkleButton>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
                          <Camera className="w-10 h-10 text-destructive" />
                        </div>
                        <h3 className="font-display font-semibold text-foreground mb-2">Camera Unavailable</h3>
                        <p className="text-sm font-medium text-destructive text-center mb-2">{cameraError}</p>
                        <p className="text-xs text-muted-foreground text-center mb-6">
                          Live photo capture is strictly required. Please resolve the error and try again.
                        </p>
                        <Button onClick={() => { setCameraError(null); setStep(0); setTimeout(() => setStep(1), 100); }} className="gradient-primary text-primary-foreground">
                          Try Again
                        </Button>
                      </>
                    )}
                  </>
                ) : (
                  <div className="text-center w-full">
                    <div className="relative w-full aspect-video rounded-xl overflow-hidden mb-4 border border-border">
                      <img src={photoPreview!} alt="Captured issue" className="w-full h-full object-cover" />
                      <div className="absolute top-2 right-2 bg-background/80 backdrop-blur-sm p-1.5 rounded-full text-accent shadow-sm">
                        <Check className="w-5 h-5" />
                      </div>
                    </div>
                    <p className="text-sm text-accent font-medium mb-4">Photo ready!</p>
                    <Button variant="outline" size="sm" onClick={retakePhoto} className="mr-2">Retake</Button>
                    <Button size="sm" onClick={() => setStep(2)}>Continue</Button>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* Step 2 — Details */}
          {step === 2 && (
            <motion.div key="details" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
                <h3 className="font-display font-semibold text-foreground">Issue Details</h3>
                <div>
                  <Label className="text-sm font-medium mb-2 block">Category *</Label>
                  <div className="flex flex-wrap gap-2">
                    {issueCategories.map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setSelectedCategory(cat)}
                        className={cn(
                          "text-xs px-3 py-1.5 rounded-full border transition-all",
                          cat === selectedCategory
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-card text-foreground border-border hover:bg-muted"
                        )}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-end mb-2">
                     <Label className="text-sm font-medium block">Location</Label>
                     <span className="text-[10px] text-muted-foreground">Tap map to refine pin</span>
                  </div>
                  <div className="rounded-xl overflow-hidden border border-border bg-muted relative h-40">
                    {location ? (
                       <IssueMap
                         issues={[]}
                         userLocation={location}
                         center={[location.lat, location.lng]}
                         zoom={16}
                         panToUser={1}
                         className="w-full h-full"
                         onMapClick={(lat, lng) => setLocation({ lat, lng })}
                       />
                    ) : (
                      <div className="flex items-center justify-center h-full text-xs text-muted-foreground">Location unavailable</div>
                    )}
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium">Description (optional)</Label>
                  <Textarea
                    placeholder="Describe the issue in detail..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="min-h-[80px] mt-2"
                  />
                </div>

                <SparkleButton
                  onClick={() => setStep(3)}
                  disabled={!selectedCategory}
                  className={cn(
                    "w-full h-10 px-4 py-2 rounded-md mt-2",
                    !selectedCategory ? "bg-muted text-muted-foreground cursor-not-allowed" : "gradient-primary text-primary-foreground"
                  )}
                >
                  Continue <ArrowRight className="w-4 h-4 ml-1" />
                </SparkleButton>
              </div>
            </motion.div>
          )}

          {/* Step 3 — Submit */}
          {step === 3 && (
            <motion.div key="submit" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
                <h3 className="font-display font-semibold text-foreground">Review & Submit</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between py-2 border-b border-border">
                    <span className="text-muted-foreground">Category</span>
                    <span className="font-medium text-foreground">{selectedCategory}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-border">
                    <span className="text-muted-foreground">Department</span>
                    <span className="font-medium text-foreground text-xs text-right max-w-[60%]">
                      {categoryDepartmentMap[selectedCategory] ?? "General"}
                    </span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-border">
                    <span className="text-muted-foreground">Location</span>
                    <span className="font-mono text-xs font-medium text-foreground">
                      {location?.lat.toFixed(5)}, {location?.lng.toFixed(5)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-border">
                    <span className="text-muted-foreground">Photo</span>
                    {photoPreview ? (
                      <img src={photoPreview} alt="Preview" className="w-12 h-12 object-cover rounded-lg shadow-sm" />
                    ) : (
                      <span className="text-xs text-muted-foreground">No photo</span>
                    )}
                  </div>
                  {description && (
                    <div className="py-2 border-b border-border">
                      <span className="text-muted-foreground block mb-1">Description</span>
                      <span className="text-sm text-foreground">{description}</span>
                    </div>
                  )}
                </div>
                <SparkleButton
                  onClick={handleSubmit}
                  disabled={submitting || !selectedCategory || !location}
                  className={cn(
                    "w-full h-10 px-4 py-2 rounded-md",
                    (submitting || !selectedCategory || !location)
                      ? "bg-muted text-muted-foreground cursor-not-allowed"
                      : "gradient-primary text-primary-foreground"
                  )}
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  {submitting ? "Submitting..." : "Submit Report"}
                </SparkleButton>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {step > 0 && step <= 3 && (
          <button
            onClick={() => setStep(step - 1)}
            className="flex items-center gap-1 text-sm text-muted-foreground mt-4 hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
        )}
      </div>

      <BottomNav />
    </div>
  );
};

export default CitizenReport;
