"use client";
import React, { createContext, useContext, useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { translations, Language, TranslationKey } from "@/lib/translations";

interface LanguageContextType {
    language: Language;
    setLanguage: (lang: Language) => void;
    t: (key: TranslationKey) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
    const { data: session, update } = useSession();
    const [language, setLanguageState] = useState<Language>("en");

    // Sync with session on load and updates
    useEffect(() => {
        const sessionLang = (session?.user as any)?.language;
        if (sessionLang && sessionLang !== language) {
            console.log(`[LANG-SYNC] Updating state to session lang: ${sessionLang}`);
            setLanguageState(sessionLang);
        }
    }, [session, language]);

    const setLanguage = async (lang: Language) => {
        if (lang === language) return;

        console.log(`[LANG-DEBUG] Switching language to: ${lang}`);
        setLanguageState(lang);

        // Update session - this will trigger the JWT callback with trigger: "update"
        try {
            const newSession = await update({ language: lang });
            console.log("[LANG-DEBUG] Session update result:", (newSession as any)?.user?.language);

            // Also update in DB via API for persistence across logins
            await fetch("/api/profile", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ language: lang }),
            });
        } catch (error) {
            console.error("Failed to update language:", error);
        }
    };

    const t = (key: TranslationKey): string => {
        return translations[language][key] || key;
    };

    return (
        <LanguageContext.Provider value={{ language, setLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    );
}

export function useLanguage() {
    const context = useContext(LanguageContext);
    if (context === undefined) {
        throw new Error("useLanguage must be used within a LanguageProvider");
    }
    return context;
}
