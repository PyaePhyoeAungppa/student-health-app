"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { ArrowLeft, Edit, Plus, Loader2, HeartPulse, Weight, Ruler, Eye, Ear } from "lucide-react";
import Link from "next/link";
import { calculateAge, formatDate, getBMICategory } from "@/lib/utils";
import { useLanguage } from "@/components/providers/language-provider";

export default function StudentDetailPage() {
    const { id } = useParams();
    const router = useRouter();
    const { t, language } = useLanguage();
    const { data: session } = useSession();
    const role = (session?.user as any)?.role;
    const [student, setStudent] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch(`/api/students/${id}`)
            .then(r => r.json())
            .then(d => { setStudent(d); setLoading(false); })
            .catch(() => setLoading(false));
    }, [id]);

    if (loading) return (
        <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
    );

    if (!student || student.error) return (
        <div className="text-center text-muted-foreground py-20">{t("studentNotFound")}</div>
    );

    const latestRecord = student.healthRecords?.[0];
    const bmiInfo = latestRecord?.bmi ? getBMICategory(latestRecord.bmi) : null;

    return (
        <div>
            <div className="flex items-center gap-4 mb-8">
                <button onClick={() => router.back()} className="text-muted-foreground hover:text-foreground transition-colors">
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <div className="flex-1">
                    <h1 className="page-title">{student.firstName} {student.surName}</h1>
                    <p className="text-muted-foreground text-sm">{student.studentId} · {student.class} · {student.school?.name}</p>
                </div>
                {(role === "SYSTEM_ADMIN" || role === "COMPANY_STAFF") && (
                    <Link href={`/dashboard/health-records/new?studentId=${student.id}`}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white"
                        style={{ background: "linear-gradient(135deg, hsl(199,89%,48%) 0%, hsl(262,83%,58%) 100%)" }}>
                        <Plus className="w-4 h-4" /> {t("addRecord")}
                    </Link>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                {/* Student Info */}
                <div className="glass-card p-6 lg:col-span-1">
                    <h2 className="font-semibold mb-4 text-sm uppercase tracking-wider text-muted-foreground">{t("studentInformation")}</h2>
                    <div className="space-y-3 text-sm">
                        {[
                            [t("studentId"), student.studentId],
                            [t("fullName"), `${student.firstName} ${student.surName}`],
                            [t("gender"), t(student.gender.toLowerCase() as any) || student.gender],
                            [t("dob"), formatDate(student.dob, language)],
                            [t("age"), `${calculateAge(student.dob)} ${t("years")}`],
                            [t("class"), student.class],
                            [t("rosterNumber"), student.orderNumber],
                            [t("school"), student.school?.name],
                        ].map(([label, val]) => (
                            <div key={label.toString()} className="flex justify-between gap-2">
                                <span className="text-muted-foreground">{label}</span>
                                <span className="font-medium text-right">{val}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Latest Health Stats */}
                <div className="lg:col-span-2 space-y-4">
                    {latestRecord ? (
                        <>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                {[
                                    { icon: Weight, label: t("weight"), value: `${latestRecord.weight} kg`, color: "hsl(199,89%,48%)" },
                                    { icon: Ruler, label: t("height"), value: `${latestRecord.height} cm`, color: "hsl(262,83%,58%)" },
                                    { icon: HeartPulse, label: t("bmi"), value: latestRecord.bmi, color: bmiInfo?.color.includes("green") ? "hsl(142,76%,45%)" : bmiInfo?.color.includes("blue") ? "hsl(199,89%,48%)" : bmiInfo?.color.includes("yellow") ? "hsl(38,92%,50%)" : "hsl(0,84%,60%)" },
                                    { icon: Eye, label: t("vision"), value: latestRecord.visionPrescription || "20/20", color: "hsl(290,70%,60%)" },
                                ].map(({ icon: Icon, label, value, color }) => (
                                    <div key={label} className="glass-card p-4 text-center">
                                        <Icon className="w-5 h-5 mx-auto mb-2" style={{ color }} />
                                        <p className="text-xl font-bold" style={{ color }}>{value}</p>
                                        <p className="text-xs text-muted-foreground mt-1">{label}</p>
                                        {label === t("bmi") && bmiInfo && <p className="text-xs mt-1" style={{ color }}>{t(bmiInfo.key as any)}</p>}
                                    </div>
                                ))}
                            </div>

                            <div className="glass-card p-6">
                                <h2 className="font-semibold mb-4 text-sm uppercase tracking-wider text-muted-foreground">{t("latestHealthRecord")}</h2>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                                    {[
                                        [t("bloodType"), latestRecord.bloodType],
                                        [t("underlyingDisease"), latestRecord.underlyingDisease || "—"],
                                        [t("drugAllergy"), latestRecord.drugAllergy || "—"],
                                        [t("bodyExamination"), latestRecord.bodyExamination || "—"],
                                        [t("xRayResult"), latestRecord.xRayResult || "—"],
                                        [t("year"), latestRecord.academicYear || "—"],
                                    ].map(([label, val]) => (
                                        <div key={label.toString()} className="flex justify-between gap-2">
                                            <span className="text-muted-foreground">{label}</span>
                                            <span className="font-medium">{val}</span>
                                        </div>
                                    ))}
                                    <div className="flex justify-between gap-2">
                                        <span className="text-muted-foreground">{t("hearingTest")}</span>
                                        <span className={latestRecord.hearingTest === "NORMAL" ? "badge-normal" : "badge-abnormal"}>{t(latestRecord.hearingTest.toLowerCase() as any) || latestRecord.hearingTest}</span>
                                    </div>
                                    <div className="flex justify-between gap-2">
                                        <span className="text-muted-foreground">{t("colorBlindness")}</span>
                                        <span className={latestRecord.colorBlindness === "NORMAL" ? "badge-normal" : "badge-abnormal"}>{t(latestRecord.colorBlindness.toLowerCase() as any) || latestRecord.colorBlindness}</span>
                                    </div>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="glass-card p-12 text-center text-muted-foreground">
                            <HeartPulse className="w-10 h-10 mx-auto mb-3 opacity-30" />
                            <p>{t("noHealthRecords")}</p>
                            {(role === "SYSTEM_ADMIN" || role === "COMPANY_STAFF") && (
                                <Link href={`/dashboard/health-records/new?studentId=${student.id}`} className="text-primary hover:underline text-sm mt-2 inline-block">
                                    {t("addFirstRecord")} →
                                </Link>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* All Records History */}
            {student.healthRecords?.length > 1 && (
                <div className="glass-card p-6">
                    <h2 className="font-semibold mb-4 text-sm uppercase tracking-wider text-muted-foreground">{t("recordHistory")}</h2>
                    <div className="overflow-x-auto">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>{t("year")}</th><th>{t("weight")}</th><th>{t("height")}</th><th>{t("bmi")}</th>
                                    <th>{t("hearing")}</th><th>{t("colorBlindness")}</th><th>{t("vision")}</th><th>{t("date")}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {student.healthRecords.map((r: any) => (
                                    <tr key={r.id}>
                                        <td>{r.academicYear || "—"}</td>
                                        <td>{r.weight ?? "—"} kg</td>
                                        <td>{r.height ?? "—"} cm</td>
                                        <td className={r.bmi ? getBMICategory(r.bmi).color : ""}>{r.bmi ?? "—"}</td>
                                        <td><span className={r.hearingTest === "NORMAL" ? "badge-normal" : "badge-abnormal"}>{t(r.hearingTest.toLowerCase() as any) || r.hearingTest}</span></td>
                                        <td><span className={r.colorBlindness === "NORMAL" ? "badge-normal" : "badge-abnormal"}>{t(r.colorBlindness.toLowerCase() as any) || r.colorBlindness}</span></td>
                                        <td>{r.visionPrescription || "—"}</td>
                                        <td className="text-muted-foreground text-xs">{formatDate(r.recordedAt, language)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
