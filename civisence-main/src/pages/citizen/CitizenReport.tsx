import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import BottomNav from "@/components/BottomNav";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Camera, MapPin, Check, Loader2, ArrowLeft, ArrowRight, Upload } from "lucide-react";
import { issueCategories, departments, CivicIssue, categorySeverityMap } from "@/lib/types";
import { useAuth } from "@/lib/authContext";
import { createIssue, createNotification, getUsersByWardAndRole, findNearbyDuplicate, voteOnIssue, getAuthorityByWardAndDept, getAuthoritiesByDepartment } from "@/lib/firestore";
import { Authority } from "@/lib/types";
import { getWardFromCoords } from "@/lib/wardLookup";
import { uploadToCloudinary } from "@/lib/cloudinary";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import SparkleButton from "@/components/SparkleButton";
import IssueMap from "@/components/IssueMap";

const steps = ["Location", "Capture", "Details", "Submit"];

// Map category to primary department
const categoryDepartmentMap: Record<string, string> = {
  "Pothole": "Road Maintenance Department",
  "Accident": "Police Department",          // primary — also notifies Ambulance Services
  "Garbage Overflow": "Sanitation Department",
  "Drainage Overflow": "Drainage and Sewer Department",
  "Water Leakage": "Water Supply Department",
  "Electric Cable Issue": "Electricity Department",
  "Streetlight Damage": "Street Lighting Department",
  "Ambulance Blockage": "Emergency Services",
};

// Extra departments an issue is visible to (beyond the primary)
const categoryAdditionalDepts: Record<string, string[]> = {
  "Accident": ["Ambulance Services"],
};

const CitizenReport = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationAccuracy, setLocationAccuracy] = useState<number | null>(null);
  const [detectedWard, setDetectedWard] = useState<string | null>(null);
  const [assignedAuthority, setAssignedAuthority] = useState<Authority | null>(null);
  const [locationError, setLocationError] = useState("");
  const [locating, setLocating] = useState(false);
  const watchIdRef = useRef<number | null>(null);
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
    } catch (err: unknown) {
      console.error("Camera fail:", err);
      const e = err as Error & { name?: string };
      let errMsg = "Unknown camera error";
      if (e.message === "INSECURE_CONTEXT") {
         errMsg = "Browser blocked camera. You must be on HTTPS or 'localhost' to access hardware.";
      } else if (e.name === "NotAllowedError") {
         errMsg = "You denied browser camera permissions.";
      } else if (e.name === "NotFoundError") {
         errMsg = "No physical camera detected on this device.";
      } else {
         errMsg = e.message || "Failed to start hardware camera.";
      }
      setCameraError(errMsg);
      toast.error(errMsg);
    }
  }, []);

  // Stop any active watchPosition
  const stopWatch = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
  }, []);

  const handleGetLocation = useCallback(() => {
    setLocating(true);
    setLocationError("");
    setLocation(null);
    setLocationAccuracy(null);
    stopWatch();

    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser.");
      setLocating(false);
      return;
    }

    // Hard timeout — accept whatever we have after 15 seconds
    const ACCURACY_GOAL = 30; // metres — "good enough" threshold
    const HARD_TIMEOUT_MS = 15_000;
    let settled = false;
    let bestLat: number | null = null;
    let bestLng: number | null = null;
    let bestAccuracy: number | null = null;

    const advance = (lat: number, lng: number, accuracy: number) => {
      if (settled) return;
      settled = true;
      stopWatch();
      setLocation({ lat, lng });
      setLocationAccuracy(accuracy);
      setLocating(false);
      setStep(1);
      // Ward detection in background
      getWardFromCoords(lat, lng).then((ward) => { if (ward) setDetectedWard(ward); });
    };

    const hardDeadline = setTimeout(() => {
      if (!settled && bestLat !== null && bestLng !== null) {
        advance(bestLat, bestLng, bestAccuracy ?? 999);
      } else if (!settled) {
        setLocationError("GPS timed out. Please try again outdoors.");
        setLocating(false);
        stopWatch();
      }
    }, HARD_TIMEOUT_MS);

    const id = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude: lat, longitude: lng, accuracy } = pos.coords;
        // Always update live preview
        setLocation({ lat, lng });
        setLocationAccuracy(accuracy);
        // Track best reading
        if (bestAccuracy === null || accuracy < bestAccuracy) {
          bestLat = lat; bestLng = lng; bestAccuracy = accuracy;
        }
        if (accuracy <= ACCURACY_GOAL) {
          clearTimeout(hardDeadline);
          advance(lat, lng, accuracy);
        }
      },
      (err) => {
        clearTimeout(hardDeadline);
        stopWatch();
        let msg = "Location request failed.";
        if (err.code === 1) msg = "Location permission denied. Please allow location access.";
        if (err.code === 2) msg = "Your location is unavailable. Try moving outdoors.";
        if (err.code === 3) msg = "Location request timed out. Try again outdoors.";
        setLocationError(msg);
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: HARD_TIMEOUT_MS, maximumAge: 0 }
    );
    watchIdRef.current = id;
  }, [stopWatch]);

  // Clean up watchPosition when component unmounts
  useEffect(() => { return () => stopWatch(); }, [stopWatch]);

  useEffect(() => {
    if (step === 1 && !photoTaken && !cameraError) {
      void startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [step, photoTaken, cameraError, startCamera, stopCamera]);

  // Look up the responsible authority officer whenever ward + category are known
  useEffect(() => {
    const ward = detectedWard || user?.ward;
    const dept = categoryDepartmentMap[selectedCategory];
    if (!ward || !dept) { setAssignedAuthority(null); return; }
    getAuthorityByWardAndDept(ward, dept).then(setAssignedAuthority);
  }, [detectedWard, selectedCategory, user?.ward]);

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
        } catch (uploadErr: unknown) {
          console.error("Cloudinary upload fail:", uploadErr);
          toast.error("Image upload failed. Submitting report anyway.");
        }
      }

      const dept = categoryDepartmentMap[selectedCategory] ?? "General";
      const additionalDepts = categoryAdditionalDepts[selectedCategory] ?? [];
      const isAccident = selectedCategory === "Accident";
      // Use GPS-detected ward; fall back to citizen's registered ward
      const issueWard = detectedWard || user.ward || "";

      // Check for a nearby duplicate (same department + location within 100m)
      const duplicate = await findNearbyDuplicate(location.lat, location.lng, dept, issueWard);

      let createdIssue: CivicIssue;
      if (duplicate) {
        // Vote on the existing issue (increments reportCount, upgrades severity at 5+)
        await voteOnIssue(duplicate.id, duplicate.reportCount ?? 1);

        // Save a shadow record so it appears in this citizen's "My Reports" page
        const shadowIssue: Omit<CivicIssue, "id" | "reportedAt"> = {
          title: selectedCategory,
          description,
          category: selectedCategory,
          location: `${location.lat.toFixed(5)}, ${location.lng.toFixed(5)}`,
          lat: location.lat,
          lng: location.lng,
          status: duplicate.status,
          severity: duplicate.severity,
          department: dept,
          ...(additionalDepts.length > 0 && { additionalDepartments: additionalDepts }),
          reportCount: 1,
          ward: issueWard,
          city: user.city,
          userId: user.uid,
          imageUrl: finalImageUrl || duplicate.imageUrl,
          timeline: [{ label: "Voted on existing issue", date: new Date().toISOString(), done: true }],
          isDuplicate: true,
          originalIssueId: duplicate.id,
        };
        createdIssue = await createIssue(shadowIssue);
        toast.info("A similar issue in your area is already being tracked. Your vote has been counted!");
      } else {
        const autoSeverity = categorySeverityMap[selectedCategory] ?? "medium";
        const newIssue: Omit<CivicIssue, "id" | "reportedAt"> = {
          title: selectedCategory,
          description,
          category: selectedCategory,
          location: `${location.lat.toFixed(5)}, ${location.lng.toFixed(5)}`,
          lat: location.lat,
          lng: location.lng,
          status: "open",
          severity: autoSeverity,
          department: dept,
          ...(additionalDepts.length > 0 && { additionalDepartments: additionalDepts }),
          reportCount: 1,
          ward: issueWard,
          city: user.city,
          userId: user.uid,
          imageUrl: finalImageUrl,
          timeline: [{ label: "Issue reported", date: new Date().toISOString(), done: true }],
        };
        createdIssue = await createIssue(newIssue);
      }

      // Notify authority officers in the detected ward
      if (issueWard) {
        try {
          const wardAuthorities = await getUsersByWardAndRole(issueWard, "authority");
          await Promise.all(wardAuthorities.map(authority =>
            createNotification({
              userId: authority.uid,
              type: "new_issue",
              title: isAccident ? "🚨 ACCIDENT REPORTED in Your Ward" : "New Issue in Your Ward",
              message: isAccident
                ? `URGENT: Accident reported at ${createdIssue.location}. Immediate response required.`
                : `A new ${createdIssue.category} issue was reported: "${createdIssue.title}" at ${createdIssue.location}`,
              read: false,
              createdAt: new Date().toISOString(),
              issueId: createdIssue.id,
            })
          ));
        } catch (notifErr) {
          console.error("Failed to notify ward authorities:", notifErr);
        }
      }

      // For accidents: also notify ALL ambulance authorities (cross-ward — nearest response)
      if (isAccident) {
        try {
          const ambulanceAuthorities = await getAuthoritiesByDepartment("Ambulance Services");
          await Promise.all(ambulanceAuthorities.map(a =>
            createNotification({
              userId: a.uid,
              type: "new_issue",
              title: "🚑 ACCIDENT — Ambulance Required",
              message: `Accident reported at ${createdIssue.location} (${issueWard}). Coordinates: ${location.lat.toFixed(5)}, ${location.lng.toFixed(5)}. Please respond immediately.`,
              read: false,
              createdAt: new Date().toISOString(),
              issueId: createdIssue.id,
            })
          ));
        } catch (notifErr) {
          console.error("Failed to notify ambulance:", notifErr);
        }
      }

      if (!duplicate) {
        if (isAccident) {
          toast.success("Accident reported! Police and Ambulance have been notified.", { duration: 5000 });
        } else {
          toast.success("Report submitted successfully!");
        }
      }
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
    <div className="min-h-screen bg-background pb-safe-nav">
      <div className="gradient-primary px-5 pb-6 rounded-b-3xl pt-safe-header">
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
                <div className={cn(
                  "w-20 h-20 rounded-full flex items-center justify-center mb-4 transition-colors",
                  locating ? "bg-primary/10" : "bg-muted"
                )}>
                  <MapPin className={cn("w-10 h-10", locating ? "text-primary animate-pulse" : "text-primary")} />
                </div>
                <h3 className="font-display font-semibold text-foreground mb-2">Access Location</h3>

                {locating && location ? (
                  <div className="w-full mb-5 space-y-2">
                    {/* Live accuracy indicator */}
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="w-3.5 h-3.5 text-primary animate-spin" />
                      <span className="text-xs text-muted-foreground">Improving accuracy…</span>
                      {locationAccuracy !== null && (
                        <span className={cn(
                          "text-xs font-bold px-2 py-0.5 rounded-full",
                          locationAccuracy <= 30 ? "bg-success/15 text-success" :
                          locationAccuracy <= 80 ? "bg-warning/15 text-warning" :
                          "bg-destructive/15 text-destructive"
                        )}>
                          ±{Math.round(locationAccuracy)}m
                        </span>
                      )}
                    </div>
                    {/* Accuracy bar — stepped Tailwind widths avoid inline styles */}
                    {locationAccuracy !== null && (
                      <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                        <div
                          className={cn(
                            "h-full rounded-full transition-all duration-500",
                            locationAccuracy <= 15 ? "bg-success w-full" :
                            locationAccuracy <= 30 ? "bg-success w-4/5" :
                            locationAccuracy <= 50 ? "bg-warning w-3/5" :
                            locationAccuracy <= 100 ? "bg-warning w-2/5" :
                            locationAccuracy <= 200 ? "bg-destructive w-1/5" : "bg-destructive w-[8%]"
                          )}
                        />
                      </div>
                    )}
                    <p className="text-[10px] text-muted-foreground text-center">Hold still for best accuracy. Will lock automatically at ±30m.</p>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center mb-6">
                    We need your exact location to tag the civic issue accurately.
                  </p>
                )}

                {locationError && <p className="text-xs text-destructive mb-4 text-center">{locationError}</p>}

                {!locating && (
                  <SparkleButton onClick={handleGetLocation} disabled={locating} className="gradient-primary text-primary-foreground h-10 px-4 py-2 rounded-md">
                    <MapPin className="w-4 h-4 mr-2" />
                    {locationError ? "Retry" : "Get Location"}
                  </SparkleButton>
                )}

                {locating && location && locationAccuracy !== null && locationAccuracy > 30 && (
                  <button
                    type="button"
                    onClick={() => {
                      if (location) {
                        stopWatch();
                        setLocating(false);
                        setStep(1);
                        getWardFromCoords(location.lat, location.lng).then((ward) => { if (ward) setDetectedWard(ward); });
                      }
                    }}
                    className="mt-3 text-xs text-muted-foreground underline underline-offset-2"
                  >
                    Use current reading (±{Math.round(locationAccuracy)}m)
                  </button>
                )}
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
                        type="button"
                        onClick={() => setSelectedCategory(cat)}
                        className={cn(
                          "text-xs px-3 py-1.5 rounded-full border transition-all font-medium",
                          cat === selectedCategory
                            ? cat === "Accident"
                              ? "bg-destructive text-destructive-foreground border-destructive"
                              : "bg-primary text-primary-foreground border-primary"
                            : cat === "Accident"
                              ? "bg-destructive/10 text-destructive border-destructive/30 hover:bg-destructive/20"
                              : "bg-card text-foreground border-border hover:bg-muted"
                        )}
                      >
                        {cat === "Accident" ? "🚨 Accident" : cat}
                      </button>
                    ))}
                  </div>

                  {/* Accident urgency banner */}
                  {selectedCategory === "Accident" && (
                    <div className="mt-3 bg-destructive/10 border border-destructive/30 rounded-xl p-3 flex items-start gap-2">
                      <span className="text-base flex-shrink-0">🚨</span>
                      <div>
                        <p className="text-xs font-bold text-destructive">Emergency Report</p>
                        <p className="text-[11px] text-destructive/80 mt-0.5">
                          This will immediately notify the nearest Police and Ambulance services with your exact location.
                        </p>
                      </div>
                    </div>
                  )}
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
                         locationAccuracy={locationAccuracy}
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
                      {selectedCategory === "Accident"
                        ? "Police Department + Ambulance Services"
                        : (categoryDepartmentMap[selectedCategory] ?? "General")}
                    </span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-border">
                    <span className="text-muted-foreground">Ward</span>
                    <span className="font-medium text-foreground text-xs">
                      {detectedWard ?? user?.ward ?? "Detecting…"}
                    </span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-border">
                    <span className="text-muted-foreground">Authority</span>
                    <span className="font-medium text-foreground text-xs text-right max-w-[60%]">
                      {assignedAuthority
                        ? `${assignedAuthority.name} (${assignedAuthority.officerId})`
                        : "No officer assigned yet"}
                    </span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-border">
                    <span className="text-muted-foreground">Location</span>
                    <div className="text-right">
                      <span className="font-mono text-xs font-medium text-foreground block">
                        {location?.lat.toFixed(5)}, {location?.lng.toFixed(5)}
                      </span>
                      {locationAccuracy !== null && (
                        <span className={cn(
                          "text-[10px] font-semibold",
                          locationAccuracy <= 30 ? "text-success" :
                          locationAccuracy <= 80 ? "text-warning" : "text-destructive"
                        )}>
                          ±{Math.round(locationAccuracy)}m accuracy
                        </span>
                      )}
                    </div>
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
            type="button"
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
