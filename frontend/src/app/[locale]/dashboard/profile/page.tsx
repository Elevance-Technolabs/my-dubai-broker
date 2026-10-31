"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Camera } from "lucide-react";
import Button from "@/components/ui/Button";
import ImageWithLoader from "@/components/ui/ImageWithLoader";
import { ProfileService, type MyProfileResult } from "@/services/profile.service";
import { UploadService } from "@/services/upload.service";
import { profileSchema } from "@/lib/schemas/accountSchemas";
import { validateImageFile } from "@/lib/utils/r2Upload";

type ProfileErrors = Record<string, string | undefined>;

const inputClass = (error?: string) =>
  `w-full px-4 py-3 border text-sm focus:outline-none focus:border-luxury-gold ${
    error ? "border-red-500 bg-red-50" : "border-gray-200"
  }`;

const FieldError = ({ message }: { message?: string }) => (
  <p className="text-sm text-red-500 mt-0.5 min-h-5">{message}</p>
);

export default function ProfilePage() {
  const [data, setData] = useState<MyProfileResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [phone, setPhone] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [languages, setLanguages] = useState("");
  const [showPhone, setShowPhone] = useState(true);
  const [showWhatsapp, setShowWhatsapp] = useState(true);
  const [showEmail, setShowEmail] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [errors, setErrors] = useState<ProfileErrors>({});

  useEffect(() => {
    ProfileService.getMyProfile().then((response) => {
      if (response.success && response.data) {
        setData(response.data);
        const p = response.data.profile;
        setDisplayName(p?.displayName ?? response.data.user.name ?? "");
        setBio(p?.bio ?? "");
        setPhone(p?.phone ?? response.data.user.phone ?? "");
        setWhatsapp(p?.whatsapp ?? "");
        setContactEmail(p?.email ?? response.data.user.email ?? "");
        setLanguages((p?.languages ?? []).join(", "));
        setShowPhone(p?.showPhone ?? true);
        setShowWhatsapp(p?.showWhatsapp ?? true);
        setShowEmail(p?.showEmail ?? false);
        setPhotoPreview(p?.photoUrl ?? null);
      } else {
        toast.error(response.error || "Failed to load profile");
      }
      setIsLoading(false);
    });
  }, []);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const problem = validateImageFile(file);
    if (problem) {
      toast.error(problem);
      setErrors((prev) => ({ ...prev, photo: problem }));
      e.target.value = "";
      return;
    }
    setErrors((prev) => ({ ...prev, photo: undefined }));
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const validate = (): ProfileErrors => {
    const result = profileSchema.safeParse({
      displayName,
      bio,
      phone,
      whatsapp,
      email: contactEmail,
      languages,
    });
    const next: ProfileErrors = {};
    if (!result.success) {
      for (const issue of result.error.issues) {
        next[String(issue.path[0])] ??= issue.message;
      }
    }
    return next;
  };

  // Once a field has been flagged, re-check on every change so the message
  // clears as soon as the value is fixed.
  const revalidate = () => {
    if (Object.keys(errors).length > 0) {
      setErrors({ ...validate(), photo: errors.photo });
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const problems = validate();
    setErrors(problems);
    const messages = Object.values(problems).filter(Boolean);
    if (messages.length > 0) {
      toast.error(messages.slice(0, 3).join("; "));
      return;
    }

    setIsSaving(true);
    try {
      let photoUploadId: string | undefined;
      if (photoFile) {
        try {
          const uploaded = await UploadService.uploadImage(photoFile, {
            context: "listing-photo",
          });
          photoUploadId = uploaded.uploadId;
        } catch (error) {
          toast.error(
            error instanceof Error ? error.message : "Failed to upload photo",
          );
          return;
        }
      }

      const response = await ProfileService.updateMyProfile({
        displayName: displayName.trim() || undefined,
        bio: bio || undefined,
        phone: phone || undefined,
        whatsapp: whatsapp || undefined,
        email: contactEmail || undefined,
        languages: languages
          ? languages.split(",").map((l) => l.trim()).filter(Boolean)
          : undefined,
        showPhone,
        showWhatsapp,
        showEmail,
        ...(photoUploadId ? { photoUploadId } : {}),
      });

      if (response.success) {
        toast.success("Profile updated");
      } else {
        if (response.fieldErrors) {
          const mapped: ProfileErrors = {};
          for (const [k, v] of Object.entries(response.fieldErrors)) {
            mapped[k === "photoUploadId" ? "photo" : k] = v;
          }
          setErrors(mapped);
        }
        toast.error(response.error || "Failed to update profile");
      }
    } catch {
      toast.error("Could not save your profile. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-8 h-8 border-4 border-luxury-gold border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="animate-fade-in-up max-w-3xl mx-auto">
      <div className="mb-16 border-b border-gray-100 pb-8">
        <h2 className="text-3xl font-serif text-luxury-black">My Profile</h2>
        <p className="text-gray-400 mt-2 font-light text-sm tracking-wide">
          This is what customers see on your public listings — separate from your login details.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-10" noValidate>
        <div className="flex items-center gap-6">
          <label className="relative w-24 h-24 rounded-full bg-gray-50 border border-gray-200 flex items-center justify-center cursor-pointer overflow-hidden shrink-0">
            {photoPreview ? (
              <ImageWithLoader src={photoPreview} alt="Profile photo" className="w-full h-full object-cover" />
            ) : (
              <Camera size={20} className="text-gray-300" />
            )}
            <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handlePhotoChange} />
          </label>
          {errors.photo && <p className="text-sm text-red-500">{errors.photo}</p>}
          <div>
            <p className="text-sm font-medium text-luxury-black">{data?.user.name}</p>
            <p className="text-xs text-gray-400">{data?.user.email} &middot; {data?.user.role.replace("_", " ")}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <label className="text-[10px] uppercase tracking-widest text-gray-500 block mb-2">
              Display name <span className="text-red-500">*</span>
            </label>
            <input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              onBlur={revalidate}
              className={inputClass(errors.displayName)}
            />
            <FieldError message={errors.displayName} />
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-widest text-gray-500 block mb-2">
              Languages (comma separated)
            </label>
            <input
              value={languages}
              onChange={(e) => setLanguages(e.target.value)}
              placeholder="English, Arabic"
              className={inputClass()}
            />
          </div>
        </div>

        <div>
          <label className="text-[10px] uppercase tracking-widest text-gray-500 block mb-2">
            Bio
          </label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            onBlur={revalidate}
            rows={4}
            className={inputClass(errors.bio)}
          />
          <FieldError message={errors.bio} />
        </div>

        <div className="space-y-6">
          <h3 className="text-[10px] uppercase tracking-widest text-gray-400 font-semibold border-b border-gray-50 pb-2">
            Public contact details
          </h3>
          {[
            { key: "phone", label: "Phone", value: phone, setValue: setPhone, show: showPhone, setShow: setShowPhone },
            { key: "whatsapp", label: "WhatsApp", value: whatsapp, setValue: setWhatsapp, show: showWhatsapp, setShow: setShowWhatsapp },
            { key: "email", label: "Email", value: contactEmail, setValue: setContactEmail, show: showEmail, setShow: setShowEmail },
          ].map((field) => (
            <div key={field.label} className="flex items-end gap-4">
              <div className="flex-1">
                <label className="text-[10px] uppercase tracking-widest text-gray-500 block mb-2">
                  {field.label}
                </label>
                <input
                  value={field.value}
                  onChange={(e) => field.setValue(e.target.value)}
                  onBlur={revalidate}
                  className={inputClass(errors[field.key])}
                />
                <FieldError message={errors[field.key]} />
              </div>
              <label className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-gray-400 pb-3 cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  checked={field.show}
                  onChange={(e) => field.setShow(e.target.checked)}
                  className="accent-luxury-gold"
                />
                Show publicly
              </label>
            </div>
          ))}
        </div>

        <Button type="submit" variant="dark" disabled={isSaving} className="h-12 px-8">
          {isSaving ? "Saving..." : "Save Profile"}
        </Button>
      </form>
    </div>
  );
}
