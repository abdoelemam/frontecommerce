"use client";

import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { userService } from "@/services/userService";
import { useAuthStore } from "@/store/useAuthStore";

export default function AccountSettingsPage() {
  const token = useAuthStore((state) => state.token);
  const queryClient = useQueryClient();

  // Profile States
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  
  // Security States
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [profileMessage, setProfileMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [passwordMessage, setPasswordMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Fetch real profile details
  const { data: profileData, isLoading } = useQuery({
    queryKey: ["userProfile"],
    queryFn: () => userService.getProfile(),
    enabled: !!token,
  });

  // Pre-fill profile details
  useEffect(() => {
    if (profileData?.user) {
      const u = profileData.user;
      setFirstName(u.fname || "");
      setLastName(u.lname || "");
      setEmail(u.email || "");
      setPhone(u.phone || "");
    }
  }, [profileData]);

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: (payload: { fname: string; lname: string; phone: string }) =>
      userService.updateProfile(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["userProfile"] });
      setProfileMessage({ type: "success", text: "Profile details updated successfully!" });
      setTimeout(() => setProfileMessage(null), 5000);
    },
    onError: (err: any) => {
      setProfileMessage({
        type: "error",
        text: err?.response?.data?.message || "Failed to update profile details.",
      });
      setTimeout(() => setProfileMessage(null), 5000);
    }
  });

  // Change password mutation
  const changePasswordMutation = useMutation({
    mutationFn: (payload: any) => userService.changePassword(payload),
    onSuccess: () => {
      setPasswordMessage({ type: "success", text: "Password changed successfully!" });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => setPasswordMessage(null), 5000);
    },
    onError: (err: any) => {
      setPasswordMessage({
        type: "error",
        text: err?.response?.data?.message || "Failed to change password. Ensure current password is correct.",
      });
      setTimeout(() => setPasswordMessage(null), 5000);
    }
  });

  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setProfileMessage(null);
    updateProfileMutation.mutate({
      fname: firstName,
      lname: lastName,
      phone,
    });
  };

  const handleUpdatePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMessage(null);

    if (newPassword !== confirmPassword) {
      setPasswordMessage({ type: "error", text: "New password and confirm password do not match." });
      return;
    }

    if (newPassword.length < 8) {
      setPasswordMessage({ type: "error", text: "New password must be at least 8 characters." });
      return;
    }

    changePasswordMutation.mutate({
      oldPassword: currentPassword,
      newPassword,
      confirmNewPassword: confirmPassword,
    });
  };

  if (!token) {
    return (
      <div className="py-xl bg-white border border-outline-variant/15 rounded-lg text-center font-body">
        <p className="text-[14px] text-on-surface-variant">Please sign in to modify settings.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="py-xl text-center font-body text-on-surface-variant/70">
        Loading settings...
      </div>
    );
  }

  return (
    <div className="space-y-lg font-body">
      <div className="pb-sm border-b border-outline-variant/15">
        <h2 className="font-display text-[22px] font-semibold text-primary">Account Settings</h2>
        <p className="text-[12px] text-on-surface-variant">Update your personal profile, contact details, and password.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-lg">
        {/* Personal Details Form */}
        <form onSubmit={handleUpdateProfile} className="bg-white p-lg border border-outline-variant/20 rounded-lg space-y-md shadow-sm">
          <h3 className="font-display text-[16px] font-semibold text-primary pb-sm border-b border-outline-variant/10">
            Personal Information
          </h3>

          {profileMessage && (
            <div
              className={`p-3 rounded text-sm ${
                profileMessage.type === "success"
                  ? "bg-green-50 text-green-800 border border-green-200"
                  : "bg-red-50 text-red-800 border border-red-200"
              }`}
            >
              {profileMessage.text}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-bold text-primary uppercase mb-2">First Name</label>
              <input
                type="text"
                required
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full border border-outline-variant px-3 py-2 text-[14px] text-primary focus:ring-1 focus:ring-primary focus:border-primary focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-primary uppercase mb-2">Last Name</label>
              <input
                type="text"
                required
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full border border-outline-variant px-3 py-2 text-[14px] text-primary focus:ring-1 focus:ring-primary focus:border-primary focus:outline-none"
              />
            </div>
          </div>
          <div>
            <label className="block text-[11px] font-bold text-primary uppercase mb-2">Email Address (Read-only)</label>
            <input
              type="email"
              disabled
              value={email}
              className="w-full border border-outline-variant px-3 py-2 text-[14px] text-on-surface-variant/60 bg-surface-container-low cursor-not-allowed focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-primary uppercase mb-2">Phone Number</label>
            <input
              type="tel"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
              className="w-full border border-outline-variant px-3 py-2 text-[14px] text-primary focus:ring-1 focus:ring-primary focus:border-primary focus:outline-none"
            />
          </div>
          <button
            type="submit"
            disabled={updateProfileMutation.isPending}
            className="w-full bg-primary text-white font-body text-[11px] font-bold uppercase tracking-widest py-3 hover:opacity-90 transition-opacity shadow-sm cursor-pointer disabled:opacity-50"
          >
            {updateProfileMutation.isPending ? "Updating..." : "Update Details"}
          </button>
        </form>

        {/* Password update Form */}
        <form onSubmit={handleUpdatePassword} className="bg-white p-lg border border-outline-variant/20 rounded-lg space-y-md shadow-sm">
          <h3 className="font-display text-[16px] font-semibold text-primary pb-sm border-b border-outline-variant/10">
            Security & Password
          </h3>

          {passwordMessage && (
            <div
              className={`p-3 rounded text-sm ${
                passwordMessage.type === "success"
                  ? "bg-green-50 text-green-800 border border-green-200"
                  : "bg-red-50 text-red-800 border border-red-200"
              }`}
            >
              {passwordMessage.text}
            </div>
          )}

          <div>
            <label className="block text-[11px] font-bold text-primary uppercase mb-2">Current Password</label>
            <input
              type="password"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full border border-outline-variant px-3 py-2 text-[14px] text-primary focus:ring-1 focus:ring-primary focus:border-primary focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-primary uppercase mb-2">New Password</label>
            <input
              type="password"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full border border-outline-variant px-3 py-2 text-[14px] text-primary focus:ring-1 focus:ring-primary focus:border-primary focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-primary uppercase mb-2">Confirm New Password</label>
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full border border-outline-variant px-3 py-2 text-[14px] text-primary focus:ring-1 focus:ring-primary focus:border-primary focus:outline-none"
            />
          </div>
          <button
            type="submit"
            disabled={changePasswordMutation.isPending}
            className="w-full bg-primary text-white font-body text-[11px] font-bold uppercase tracking-widest py-3 hover:opacity-90 transition-opacity shadow-sm cursor-pointer disabled:opacity-50"
          >
            {changePasswordMutation.isPending ? "Changing..." : "Change Password"}
          </button>
        </form>
      </div>
    </div>
  );
}
