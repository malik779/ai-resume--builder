"use client";

import { useResumeStore } from "@/stores/resume.store";
import type { PersonalInfo } from "@/types/resume";
import { cn } from "@/lib/utils/cn";
import { User, Mail, Phone, MapPin, Linkedin, Github, Globe } from "lucide-react";

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
    <div className="group">
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
  const info: Partial<PersonalInfo> = resume?.personalInfo ?? {};
  const set = (key: string) => (value: string) => updatePersonalInfo({ [key]: value });

  return (
    <div className="space-y-4">
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
