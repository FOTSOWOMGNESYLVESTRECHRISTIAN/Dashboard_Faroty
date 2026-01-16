import { useState, useEffect } from 'react';
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card";
import { Badge } from "./ui/badge";
import { ArrowLeft, Calendar, FileText, CreditCard, User, Hash, Clock, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { Transaction } from '../types/payment';
import { getTransactionById, formatCurrency, formatDate } from "../services/paymentService";
import { Loader2 } from "lucide-react";

interface TransactionDetailsProps {
    transactionId: string;
    onBack: () => void;
}

export function TransactionDetails({ transactionId, onBack }: TransactionDetailsProps) {
    const [transaction, setTransaction] = useState<Transaction | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchTransaction = async () => {
            try {
                setLoading(true);
                const data = await getTransactionById(transactionId);
                setTransaction(data);
            } catch (err: any) {
                setError(err.message || 'Erreur lors du chargement de la transaction');
            } finally {
                setLoading(false);
            }
        };

        if (transactionId) {
            fetchTransaction();
        }
    }, [transactionId]);

    const getStatusColor = (status: string) => {
        switch (status?.toLowerCase()) {
            case 'success':
            case 'completed':
            case 'succeeded':
            case 'réussi':
                return 'bg-green-500 hover:bg-green-600';
            case 'failed':
            case 'cancelled':
            case 'declined':
            case 'échoué':
                return 'bg-red-500 hover:bg-red-600';
            case 'pending':
            case 'processing':
            case 'en attente':
                return 'bg-yellow-500 hover:bg-yellow-600';
            default:
                return 'bg-gray-500 hover:bg-gray-600';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status?.toLowerCase()) {
            case 'success':
            case 'completed':
            case 'succeeded':
            case 'réussi':
                return <CheckCircle2 className="h-5 w-5 mr-2" />;
            case 'failed':
            case 'cancelled':
            case 'declined':
            case 'échoué':
                return <XCircle className="h-5 w-5 mr-2" />;
            case 'pending':
            case 'processing':
            case 'en attente':
                return <Clock className="h-5 w-5 mr-2" />;
            default:
                return <AlertCircle className="h-5 w-5 mr-2" />;
        }
    };

    if (loading) {
        return (
            <div className="flex h-64 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (error || !transaction) {
        return (
            <div className="flex flex-col items-center justify-center h-64 space-y-4">
                <AlertCircle className="h-12 w-12 text-red-500" />
                <p className="text-lg font-medium text-muted-foreground">{error || "Transaction introuvable"}</p>
                <Button onClick={onBack}>Retour</Button>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex items-center gap-4">
                <Button variant="outline" size="icon" onClick={onBack}>
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Détails de la Transaction</h2>
                    <div className="flex items-center text-muted-foreground">
                        <Hash className="h-3 w-3 mr-1" />
                        <span className="font-mono text-xs">{transaction.id}</span>
                    </div>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {/* Main Status Card */}
                <Card className="md:col-span-2 lg:col-span-2">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-lg font-medium">État de la transaction</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className={`rounded-xl p-6 text-white flex flex-col md:flex-row justify-between items-center ${getStatusColor(transaction.status)} shadow-md`}>
                            <div className="flex items-center mb-4 md:mb-0">
                                {getStatusIcon(transaction.status)}
                                <span className="text-xl font-bold capitalize">{transaction.status}</span>
                            </div>
                            <div className="text-3xl font-bold tracking-tight">
                                {formatCurrency(transaction.amount, transaction.currency)}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Date & Time */}
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
                            <Calendar className="h-4 w-4 mr-2" /> Date et Heure
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-semibold">
                            {new Date(transaction.createdAt).toLocaleDateString()}
                        </div>
                        <div className="text-muted-foreground">
                            {new Date(transaction.createdAt).toLocaleTimeString()}
                        </div>
                    </CardContent>
                </Card>

                {/* Description / Content */}
                <Card className="md:col-span-3">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-lg font-medium flex items-center">
                            <FileText className="h-5 w-5 mr-2" /> Informations
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-sm font-medium text-muted-foreground">Description</label>
                                <div className="p-3 bg-muted/50 rounded-md border min-h-[3rem] flex items-center">
                                    {transaction.description || "Aucune description"}
                                </div>
                            </div>
                            <div className="space-y-1">
                                <label className="text-sm font-medium text-muted-foreground">Devise</label>
                                <div className="p-3 bg-muted/50 rounded-md border flex items-center">
                                    {transaction.currency}
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Technical Data Dump */}
                <Card className="md:col-span-3">
                    <CardHeader>
                        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
                            <CreditCard className="h-4 w-4 mr-2" /> Données Techniques (Debug)
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="bg-slate-950 text-slate-50 p-4 rounded-lg font-mono text-xs overflow-x-auto">
                            <pre>{JSON.stringify(transaction, null, 2)}</pre>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
