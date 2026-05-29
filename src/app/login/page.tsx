"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Loader2, HeartPulse, ShieldCheck, Eye, EyeOff } from "lucide-react";

const getWavyCirclePath = (cx: number, cy: number, radius: number, waves: number, amplitude: number) => {
    let path = "";
    const points = 120;
    for (let i = 0; i <= points; i++) {
        const angle = (i / points) * Math.PI * 2;
        const r = radius + Math.sin(angle * waves) * amplitude;
        const x = cx + r * Math.cos(angle);
        const y = cy + r * Math.sin(angle);
        path += (i === 0 ? "M " : " L ") + `${x.toFixed(2)},${y.toFixed(2)}`;
    }
    return path + " Z";
};

export default function LoginPage() {
    const router = useRouter();
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [showPass, setShowPass] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        const result = await signIn("credentials", {
            username,
            password,
            redirect: false,
        });
        setLoading(false);
        if (result?.error) {
            setError("Invalid username, email, or password. Please try again.");
        } else {
            router.push("/dashboard");
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
            {/* Background orbs */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full opacity-20 blur-[120px]"
                    style={{ background: "radial-gradient(circle, hsl(212, 100%, 52%) 0%, transparent 70%)" }} />
                <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full opacity-15 blur-[120px]"
                    style={{ background: "radial-gradient(circle, hsl(199, 89%, 48%) 0%, transparent 70%)" }} />
            </div>

            <div className="w-full max-w-md animate-fade-in">
                {/* Logo */}
                <div className="text-center mb-8 flex flex-col items-center">
                    <div className="relative w-24 h-24 mb-4 flex items-center justify-center group cursor-pointer">
                        <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full drop-shadow-sm transition-transform duration-700 ease-in-out group-hover:rotate-180">
                            <defs>
                                <linearGradient id="wavy-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                    <stop offset="0%" stopColor="hsl(var(--primary))" />
                                    <stop offset="100%" stopColor="hsl(var(--accent))" />
                                </linearGradient>
                            </defs>
                            <path
                                d={getWavyCirclePath(50, 50, 44, 14, 2.5)}
                                fill="url(#wavy-gradient)"
                            />
                            <circle cx="50" cy="50" r="37" fill="hsl(var(--card))" />
                            <circle cx="50" cy="50" r="34" fill="none" stroke="hsl(var(--primary) / 0.15)" strokeWidth="1" strokeDasharray="3,3" />
                        </svg>
                        <div className="relative z-10 w-[72px] h-[72px] rounded-full bg-primary/10 flex items-center justify-center">
                            <HeartPulse className="w-9 h-9 text-primary bouncy-avatar-icon" />
                        </div>
                    </div>
                    <h1 className="text-3xl font-bold gradient-text">Delta Healthcare Thailand</h1>
                    <p className="text-muted-foreground mt-2 text-sm">ระบบข้อมูลสุขภาพนักเรียน</p>
                    <p className="text-muted-foreground text-xs">Delta Healthcare Thailand</p>
                </div>

                {/* Card */}
                <div className="glass-card p-8 shadow-2xl">
                    <h2 className="text-xl font-semibold mb-6 text-center">Sign In</h2>

                    {error && (
                        <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-2">
                            <ShieldCheck className="w-4 h-4 shrink-0" />
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-muted-foreground mb-1.5">Username or Email</label>
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="w-full px-4 py-3 rounded-lg bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                                placeholder="Enter your username or email"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-muted-foreground mb-1.5">Password</label>
                            <div className="relative">
                                <input
                                    type={showPass ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full px-4 py-3 pr-12 rounded-lg bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                                    placeholder="Enter your password"
                                    required
                                />
                                <button type="button" onClick={() => setShowPass(!showPass)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                                    {showPass ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3 rounded-lg font-semibold text-white flex items-center justify-center gap-2 transition-all disabled:opacity-70 hover:opacity-90 active:scale-[0.98]"
                            style={{ background: "linear-gradient(135deg, hsl(212, 100%, 52%) 0%, hsl(199, 89%, 48%) 100%)" }}>
                            {loading ? <><Loader2 className="w-5 h-5 animate-spin" /> Signing in...</> : "Sign In"}
                        </button>
                    </form>


                </div>

                <p className="text-center text-xs text-muted-foreground mt-6">
                    Are you a student?{" "}
                    <a href="/student-portal" className="text-primary hover:underline">Check your health data →</a>
                </p>
            </div>
        </div>
    );
}
