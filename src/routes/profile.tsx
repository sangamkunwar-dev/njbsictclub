import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Upload, QrCode, Save, X, Download } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/components/auth-provider";
import { toast } from "sonner";

export const Route = createFileRoute("/profile")({
  component: ProfilePage,
});

interface ProfileData {
  bio: string;
  skills: string[];
  github: string;
  linkedin: string;
  twitter: string;
  avatar: string | null;
  qr: string | null;
}

const EMPTY: ProfileData = { bio: "", skills: [], github: "", linkedin: "", twitter: "", avatar: null, qr: null };

function ProfilePage() {
  const { user, loading } = useAuth();
  const nav = useNavigate();
  const [profile, setProfile] = useState<ProfileData>(EMPTY);
  const [skillInput, setSkillInput] = useState("");

  useEffect(() => {
    if (!loading && !user) nav({ to: "/auth", search: { redirect: "/profile" } });
  }, [loading, user, nav]);

  useEffect(() => {
    if (user) {
      const stored = localStorage.getItem(`ict-profile-${user.id}`);
      if (stored) setProfile(JSON.parse(stored));
    }
  }, [user]);

  if (!user) return null;

  const save = () => {
    localStorage.setItem(`ict-profile-${user.id}`, JSON.stringify(profile));
    toast.success("Profile saved");
  };

  const readFile = (file: File, key: "avatar" | "qr") => {
    const reader = new FileReader();
    reader.onload = (e) => setProfile((p) => ({ ...p, [key]: e.target?.result as string }));
    reader.readAsDataURL(file);
  };

  const addSkill = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && skillInput.trim()) {
      e.preventDefault();
      setProfile((p) => ({ ...p, skills: [...new Set([...p.skills, skillInput.trim()])] }));
      setSkillInput("");
    }
  };

  // Real QR generated locally from the member ID; custom uploads override it.
  const [autoQr, setAutoQr] = useState<string | null>(null);
  useEffect(() => {
    if (!user.memberId) { setAutoQr(null); return; }
    let alive = true;
    void import("qrcode").then((QR) =>
      QR.toDataURL(user.memberId as string, {
        width: 512,
        margin: 2,
        errorCorrectionLevel: "M",
        color: { dark: "#000000", light: "#ffffff" },
      }).then((url: string) => { if (alive) setAutoQr(url); }),
    );
    return () => { alive = false; };
  }, [user.memberId]);
  const shownQr = profile.qr ?? autoQr;


  return (
    <div className="container mx-auto px-3 sm:px-4 md:px-6 py-10 md:py-16 max-w-4xl">
      <div className="mb-8 flex items-center justify-between flex-wrap gap-4">
        <div>
          <Badge variant="secondary" className="mb-2">Your profile</Badge>
          <h1 className="text-3xl md:text-4xl font-bold font-display">{user.name}</h1>
          <p className="text-sm text-muted-foreground mt-1">{user.email} · <span className="capitalize">{user.role}</span>{user.memberId && ` · `}{user.memberId && <span className="font-mono text-primary">{user.memberId}</span>}</p>
        </div>
        <div className="flex gap-2">
          {(user.role === "member" || user.role === "admin") && (
            <Button asChild variant="outline"><Link to="/dashboard">Dashboard</Link></Button>
          )}
          <Button onClick={save} className="bg-gradient-primary"><Save className="h-4 w-4 mr-2" />Save</Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="p-6 border-border/50">
          <Label className="mb-2 block">Profile photo</Label>
          <div className="flex flex-col items-center gap-3">
            <div className="h-32 w-32 rounded-full ring-2 ring-primary/20 overflow-hidden bg-muted flex items-center justify-center">
              {profile.avatar ? <img src={profile.avatar} className="h-full w-full object-cover" alt="Avatar" /> : (user.avatar ? <img src={user.avatar} className="h-full w-full object-cover" alt="" /> : <Upload className="h-6 w-6 text-muted-foreground" />)}
            </div>
            <label className="cursor-pointer text-xs text-primary hover:underline">
              Upload new
              <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && readFile(e.target.files[0], "avatar")} />
            </label>
          </div>
        </Card>

        <Card className="p-6 border-border/50 md:col-span-2">
          <Label>Bio</Label>
          <Textarea value={profile.bio} onChange={(e) => setProfile({ ...profile, bio: e.target.value })} placeholder="Tell the club about yourself..." rows={4} className="mt-1.5" maxLength={500} />

          <Label className="mt-4 block">Tech stack</Label>
          <div className="flex flex-wrap gap-1.5 mt-1.5 mb-2">
            {profile.skills.map((s) => (
              <Badge key={s} variant="outline" className="gap-1 bg-primary/10 text-primary border-primary/20">
                {s}
                <button onClick={() => setProfile({ ...profile, skills: profile.skills.filter((x) => x !== s) })}>
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
          <Input value={skillInput} onChange={(e) => setSkillInput(e.target.value)} onKeyDown={addSkill} placeholder="Type a skill and press Enter (React, Python, CyberSec...)" />
        </Card>

        <Card className="p-6 border-border/50 md:col-span-2">
          <Label>Social links</Label>
          <div className="space-y-3 mt-2">
            <Input placeholder="GitHub URL" value={profile.github} onChange={(e) => setProfile({ ...profile, github: e.target.value })} />
            <Input placeholder="LinkedIn URL" value={profile.linkedin} onChange={(e) => setProfile({ ...profile, linkedin: e.target.value })} />
            <Input placeholder="Twitter URL" value={profile.twitter} onChange={(e) => setProfile({ ...profile, twitter: e.target.value })} />
          </div>
        </Card>

        <Card className="p-6 border-border/50">
          <Label className="mb-2 flex items-center gap-1.5"><QrCode className="h-4 w-4" /> Member QR</Label>
          <div className="aspect-square rounded-lg border border-dashed border-border bg-white flex items-center justify-center overflow-hidden">
            {shownQr ? (
              <img src={shownQr} className="h-full w-full object-contain p-2" alt={`QR for ${user.memberId ?? user.name}`} />
            ) : (
              <div className="text-center p-4">
                <QrCode className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
                <p className="text-[10px] text-muted-foreground">Members get a QR — sign up as Member to receive one.</p>
              </div>
            )}
          </div>
          {user.memberId && (
            <p className="mt-2 text-center font-mono text-[11px] text-muted-foreground">{user.memberId}</p>
          )}
          <div className="mt-3 flex flex-col gap-1.5">
            {shownQr && (
              <a
                href={shownQr}
                download={`${user.memberId ?? "member"}-qr.png`}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-primary hover:underline text-center inline-flex items-center justify-center gap-1"
              >
                <Download className="h-3 w-3" /> Download QR
              </a>
            )}
            <label className="cursor-pointer text-xs text-muted-foreground hover:text-primary text-center">
              Upload custom QR
              <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && readFile(e.target.files[0], "qr")} />
            </label>
            {profile.qr && (
              <button
                onClick={() => setProfile({ ...profile, qr: null })}
                className="text-[11px] text-destructive hover:underline"
              >
                Reset to auto QR
              </button>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
