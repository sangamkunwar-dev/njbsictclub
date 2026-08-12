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

  if (missing) return <div className="container mx-auto max-w-xl px-4 py-16 text-center"><h1 className="text-2xl font-bold">Profile not found</h1><p className="mt-2 text-muted-foreground">This profile link may have expired or does not exist.</p><Button asChild className="mt-6"><Link to="/"><ArrowLeft className="mr-2 h-4 w-4" />Go home</Link></Button></div>;
  if (!profile) return <div className="container mx-auto max-w-xl px-4 py-16 text-center text-muted-foreground">Loading profile…</div>;

  const { profile: details } = profile;
  return <div className="container mx-auto max-w-3xl px-4 py-10"><div className="mb-6 flex items-center justify-between"><Badge variant="secondary">Shared ICT Club profile</Badge><Button asChild variant="outline"><Link to="/"><ArrowLeft className="mr-2 h-4 w-4" />Home</Link></Button></div><Card className="overflow-hidden"><div className="bg-primary/10 p-6 sm:p-8"><div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:text-left">{details.avatar ? <img src={details.avatar} alt={`${profile.name}'s profile photo`} className="h-28 w-28 rounded-full object-cover ring-4 ring-background" /> : <div className="flex h-28 w-28 items-center justify-center rounded-full bg-primary text-4xl font-bold text-primary-foreground">{profile.name.charAt(0).toUpperCase()}</div>}<div><h1 className="text-3xl font-bold">{profile.name}</h1><p className="mt-1 text-muted-foreground">{profile.email}</p><p className="mt-2 text-sm capitalize">{profile.role}{profile.memberId ? ` · ${profile.memberId}` : ""}</p></div></div></div><div className="grid gap-6 p-6 sm:p-8 md:grid-cols-[1fr_180px]"><div className="space-y-6"><section><h2 className="font-semibold">About</h2><p className="mt-2 whitespace-pre-wrap leading-6 text-muted-foreground">{details.bio || "No bio added yet."}</p></section><section><h2 className="font-semibold">Skills</h2><div className="mt-2 flex flex-wrap gap-2">{details.skills.map((skill) => <Badge key={skill}>{skill}</Badge>)}</div></section><section><h2 className="font-semibold">Links</h2><div className="mt-2 flex flex-col gap-2 text-sm">{[details.website, details.github, details.linkedin, details.twitter].filter(Boolean).map((link) => <a key={link} href={link} target="_blank" rel="noreferrer" className="text-primary hover:underline">{link}</a>)}</div></section></div>{details.qr && <div className="text-center"><p className="mb-2 text-sm font-medium">Member QR</p><img src={details.qr} alt={`Member QR for ${profile.name}`} className="mx-auto w-full max-w-[180px] rounded-lg border bg-white p-2" /></div>}</div></Card></div>;
}
