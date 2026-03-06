import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function calculateBMI(weight: number, height: number): number {
    const heightM = height / 100;
    return parseFloat((weight / (heightM * heightM)).toFixed(1));
}

export function getBMICategory(bmi: number): { label: string; color: string } {
    if (bmi < 18.5) return { label: "Underweight", color: "text-blue-500" };
    if (bmi < 25) return { label: "Normal", color: "text-green-500" };
    if (bmi < 30) return { label: "Overweight", color: "text-yellow-500" };
    return { label: "Obese", color: "text-red-500" };
}

export function formatDate(date: Date | string): string {
    return new Date(date).toLocaleDateString("th-TH", {
        year: "numeric",
        month: "long",
        day: "numeric",
    });
}

export function formatDateEn(date: Date | string): string {
    return new Date(date).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
    });
}

export function calculateAge(dob: Date | string): number {
    const today = new Date();
    const birth = new Date(dob);
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age;
}
