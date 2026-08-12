import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/$slug")({ component: PublicProfilePage });

type SharedProfile = {
  name: string;
  email: string | null;
  role: string;
  memberId?: string;
  profile: { bio: string; skills: string[]; github: string; linkedin: string; twitter: string; website?: string; avatar: string | null; qr: string | null };
};

function PublicProfilePage() {
  const { slug } = Route.useParams();
  const [profile, setProfile] = useState<SharedProfile | null>(null);
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    void supabase.from("profile_shares").select("payload").eq("slug", slug).maybeSingle().then(({ data, error }) => {
      if (error || !data?.payload) setMissing(true);
      else setProfile(data.payload as SharedProfile);
    });
  }, [slug]);

  if (missing) return <main className="container mx-auto max-w-xl px-4 py-16 text-center"><h1 className="text-2xl font-bold">Profile not found</h1><p className="mt-2 text-muted-foreground">This profile link may have expired or does not exist.</p><Button asChild className="mt-6"><Link to="/"><ArrowLeft className="mr-2 h-4 w-4" />Go home</Link></Button></main>;
  if (!profile) return <main className="container mx-auto max-w-xl px-4 py-16 text-center text-muted-foreground">Loading profile…</main>;

  const { profile: details } = profile;
  const links = [details.website, details.github, details.linkedin, details.twitter].filter(Boolean) as string[];
  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:py-12">
        <div className="mb-10 flex items-center justify-between gap-4"><div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-primary text-sm font-bold text-primary-foreground shadow-elegant">NJ</div><div><p className="text-sm font-semibold tracking-tight">NJBS ICT Club</p><p className="text-xs text-muted-foreground">Verified member profile</p></div></div><Button asChild variant="outline" size="sm" className="rounded-full"><Link to="/"><ArrowLeft className="mr-2 h-4 w-4" />Home</Link></Button></div>
        <Card className="overflow-hidden border-border/70 shadow-elegant"><div className="relative h-32 overflow-hidden bg-gradient-primary sm:h-40"><div className="absolute inset-0 opacity-20 [background-image:linear-gradient(135deg,transparent_25%,currentColor_25%,currentColor_50%,transparent_50%,transparent_75%,currentColor_75%)] [background-size:28px_28px]" /></div><div className="px-5 pb-7 sm:px-9 sm:pb-9"><div className="-mt-14 flex flex-col gap-5 sm:-mt-16 sm:flex-row sm:items-end sm:justify-between"><div className="flex flex-col items-start gap-4 sm:flex-row sm:items-end"><div className="flex h-28 w-28 shrink-0 items-center justify-center overflow-hidden rounded-2xl border-4 border-background bg-primary text-4xl font-bold text-primary-foreground shadow-lg sm:h-32 sm:w-32">{details.avatar ? <img src={details.avatar} alt={`${profile.name}'s profile photo`} className="h-full w-full object-cover" /> : profile.name.charAt(0).toUpperCase()}</div><div className="pb-1"><Badge variant="secondary" className="mb-2 rounded-full px-3 capitalize">{profile.role}</Badge><h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{profile.name}</h1><p className="mt-1 text-sm text-muted-foreground">{profile.email}</p></div></div>{profile.memberId && <div className="rounded-xl border bg-muted/40 px-4 py-3 sm:text-right"><p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Member ID</p><p className="mt-1 font-mono text-sm font-semibold text-primary">{profile.memberId}</p></div>}</div><div className="mt-10 grid gap-8 lg:grid-cols-[1fr_220px]"><div className="space-y-8"><section><p className="text-xs font-semibold uppercase tracking-wider text-primary">About</p><p className="mt-3 whitespace-pre-wrap text-[15px] leading-7 text-muted-foreground">{details.bio || "This member has not added a bio yet."}</p></section><section><p className="text-xs font-semibold uppercase tracking-wider text-primary">Skills & expertise</p><div className="mt-3 flex flex-wrap gap-2">{details.skills.length ? details.skills.map((skill) => <Badge key={skill} variant="outline" className="bg-primary/5 px-3 py-1">{skill}</Badge>) : <p className="text-sm text-muted-foreground">No skills added yet.</p>}</div></section><section><p className="text-xs font-semibold uppercase tracking-wider text-primary">Connect</p><div className="mt-3 flex flex-col gap-2">{links.length ? links.map((link) => <a key={link} href={link} target="_blank" rel="noreferrer" className="break-all rounded-lg border bg-muted/30 px-3 py-2 text-sm text-primary transition-colors hover:bg-primary/10 hover:underline">{link}</a>) : <p className="text-sm text-muted-foreground">No public links added yet.</p>}</div></section></div><aside className="rounded-2xl border bg-muted/20 p-4 text-center"><p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Member QR</p>{details.qr ? <img src={details.qr} alt={`Member QR for ${profile.name}`} className="mx-auto mt-4 w-full max-w-[180px] rounded-xl border bg-white p-2" /> : <div className="mx-auto mt-4 flex aspect-square max-w-[180px] items-center justify-center rounded-xl border border-dashed text-center text-sm text-muted-foreground">QR unavailable</div>}{profile.memberId && <p className="mt-3 font-mono text-xs text-muted-foreground">Scan to verify member</p>}</aside></div></div></Card>
        <p className="mt-6 text-center text-xs text-muted-foreground">Shared from NJBS ICT Club · Professional member profile</p>
      </div>
    </main>
  );
}
