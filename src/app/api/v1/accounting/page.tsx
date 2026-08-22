"use client";

import { useEffect, useState } from "react";

interface Compte {
    code: string;
    libelle: string;
    classe: number;
    nature: string;
    sensNormal: string;
    postable: boolean;
}

export default function AccountingPage() {
    const [comptes, setComptes] = useState<Compte[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetch("/api/v1/accounting/comptes")
            .then((res) => {
                if (!res.ok) throw new Error(`Erreur ${res.status}`);
                return res.json();
            })
            .then((data) => {
                setComptes(data);
                setLoading(false);
            })
            .catch((err) => {
                console.error(err);
                setError(err.message);
                setLoading(false);
            });
    }, []);

    if (loading) return <div className="p-8 text-center">Chargement du plan SYSCOHADA...</div>;
    if (error) return <div className="p-8 text-center text-red-600">Erreur: {error}</div>;

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <h1 className="text-2xl font-bold mb-6 text-gray-900">Plan Comptable SYSCOHADA Révisé</h1>

            <div className="overflow-x-auto bg-white rounded-lg shadow border border-gray-200">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Code</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Libellé</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Classe</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nature</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sens Normal</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {comptes.map((compte: Compte) => (
                            <tr key={compte.code} className="hover:bg-gray-50 transition-colors">
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-mono font-semibold text-gray-900">{compte.code}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{compte.libelle}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{compte.classe}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{compte.nature}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                    <span className={`px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${compte.sensNormal === 'DEBIT'
                                            ? 'bg-green-100 text-green-800'
                                            : 'bg-blue-100 text-blue-800'
                                        }`}>
                                        {compte.sensNormal}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="mt-4 text-sm text-gray-500 text-right">
                Total: {comptes.length} comptes chargés depuis la base
            </div>
        </div>
    );
}