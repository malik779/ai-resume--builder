"use client";

import { useRef } from "react";
import { useResumeStore } from "@/stores/resume.store";
import { useCustomizeStore } from "@/stores/customize.store";
import type { PersonalInfo } from "@/types/resume";
import { cn } from "@/lib/utils/cn";
import { User, Mail, Phone, MapPin, Linkedin, Github, Globe, Camera, X, ImageOff } from "lucide-react";

// Templates that render a photo placeholder (handcrafted + generated with showPhoto/sidebarPhoto)
const PHOTO_TEMPLATES = new Set([
  "professional", "prime-ats",       // handcrafted two-column
  "monarch", "chairman",             // dark/accent banner + photo
  "apex", "chrome",                  // split header + photo
  "harbor", "impact",                // stack-left + photo
  "ambassador", "envoy",             // sidebar-left with sidebarPhoto
  "consul", "prism",                 // sidebar-right with sidebarPhoto
]);

// Compress + center-crop an image file to a square JPEG data URL (max 240px)
function compressPhoto(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const size = Math.min(img.width, img.height, 240);
      const canvas = document.createElement("canvas");
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext("2d");
      if (!ctx) { reject(new Error("canvas")); return; }
      const sx = (img.width - size) / 2;
      const sy = (img.height - size) / 2;
      ctx.drawImage(img, sx, sy, size, size, 0, 0, size, size);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL("image/jpeg", 0.82));
    };
    img.onerror = () => reject(new Error("load"));
    img.src = url;
  });
}

interface FieldProps {
  label: string;
  icon: React.ElementType;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}

function Field({ label, icon: Icon, value, onChange, placeholder, type = "text" }: FieldProps) {
  return (
    <div>
      <label className="flex items-center gap-1.5 text-xs font-medium text-gray-500 mb-1">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder ?? label}
        className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none transition-all placeholder:text-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
      />
    </div>
  );
}

export function PersonalInfoSection() {
  const { resume, updatePersonalInfo } = useResumeStore();
  const { templateId } = useCustomizeStore();
  const info: Partial<PersonalInfo> = resume?.personalInfo ?? {};
  const set = (key: string) => (value: string) => updatePersonalInfo({ [key]: value });

  const fileRef = useRef<HTMLInputElement>(null);
  const photoSupported = PHOTO_TEMPLATES.has(templateId ?? "");
  const hasPhoto = !!info.photoUrl;

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    try {
      const dataUrl = await compressPhoto(file);
      updatePersonalInfo({ photoUrl: dataUrl });
    } catch {
      // silently fail — user can try again
    }
  };

  const removePhoto = () => updatePersonalInfo({ photoUrl: "" });

  const initials = [info.firstName, info.lastName]
    .filter(Boolean)
    .map((s) => s![0].toUpperCase())
    .join("") || "?";

  return (
    <div className="space-y-4">

      {/* ── Photo upload ─────────────────────────────────────── */}
      <div className={cn(
        "rounded-xl border p-3 transition-all",
        photoSupported
          ? "border-gray-200 bg-white"
          : "border-dashed border-gray-200 bg-gray-50/60"
      )}>
        <div className="flex items-center gap-3">
          {/* Avatar preview */}
          <div className="relative shrink-0">
            <div className={cn(
              "h-16 w-16 rounded-full overflow-hidden flex items-center justify-center border-2 transition-all",
              photoSupported ? "border-gray-300" : "border-dashed border-gray-200",
              !photoSupported && "opacity-50"
            )}>
              {hasPhoto ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={info.photoUrl} alt="Profile" className="h-full w-full object-cover" />
              ) : (
                <span className={cn(
                  "text-lg font-bold select-none",
                  photoSupported ? "text-gray-400" : "text-gray-300"
                )}>
                  {initials}
                </span>
              )}
            </div>
            {/* Remove button */}
            {hasPhoto && (
              <button
                onClick={removePhoto}
                className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition-colors shadow-sm"
                title="Remove photo"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>

          {/* Upload controls */}
          <div className="flex-1 min-w-0">
            <p className={cn(
              "text-xs font-semibold mb-0.5",
              photoSupported ? "text-gray-700" : "text-gray-400"
            )}>
              Profile Photo
            </p>

            {photoSupported ? (
              <>
                <p className="text-[11px] text-gray-400 mb-2 leading-tight">
                  Square JPG/PNG · shown in resume
                </p>
                <button
                  onClick={() => fileRef.current?.click()}
                  className="flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors"
                >
                  <Camera className="h-3.5 w-3.5" />
                  {hasPhoto ? "Change photo" : "Upload photo"}
                </button>
              </>
            ) : (
              <div className="flex items-start gap-1.5">
                <ImageOff className="h-3.5 w-3.5 text-gray-300 shrink-0 mt-0.5" />
                <p className="text-[11px] text-gray-400 leading-tight">
                  Not shown in this template. Switch to{" "}
                  <span className="font-semibold text-gray-500">Professional</span> or{" "}
                  <span className="font-semibold text-gray-500">Prime ATS</span> to display your photo.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Hidden file input */}
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={handleFile}
        />
      </div>

      {/* ── Text fields ──────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3">
        <Field label="First Name" icon={User} value={info.firstName ?? ""} onChange={set("firstName")} />
        <Field label="Last Name" icon={User} value={info.lastName ?? ""} onChange={set("lastName")} />
      </div>
      <Field label="Professional Headline" icon={User} value={info.headline ?? ""} onChange={set("headline")} placeholder="e.g. Senior Software Engineer | React | Node.js" />
      <div className="grid grid-cols-2 gap-3">
        <Field label="Email" icon={Mail} value={info.email ?? ""} onChange={set("email")} type="email" />
        <Field label="Phone" icon={Phone} value={info.phone ?? ""} onChange={set("phone")} />
      </div>
      <Field label="Location" icon={MapPin} value={info.location ?? ""} onChange={set("location")} placeholder="City, State or Remote" />
      <Field label="LinkedIn URL" icon={Linkedin} value={info.linkedinUrl ?? ""} onChange={set("linkedinUrl")} placeholder="https://linkedin.com/in/..." />
      <div className="grid grid-cols-2 gap-3">
        <Field label="GitHub URL" icon={Github} value={info.githubUrl ?? ""} onChange={set("githubUrl")} />
        <Field label="Portfolio URL" icon={Globe} value={info.portfolioUrl ?? ""} onChange={set("portfolioUrl")} />
      </div>
    </div>
  );
}
