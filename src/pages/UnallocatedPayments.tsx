import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Loader2, Link } from 'lucide-react';
import { Modal } from '../components/Modal';

export default function UnallocatedPayments() {
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // Allocation Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedPayment, setSelectedPayment] = useState<any>(null);
    const [members, setMembers] = useState([]);
    const [memberId, setMemberId] = useState('');
    const [targetType, setTargetType] = useState('CONTRIBUTION');
    const [targetId, setTargetId] = useState('');
    const [allocating, setAllocating] = useState(false);

    // Contextual data based on selected member/type
    const [memberLoans, setMemberLoans] = useState([]);
    const [memberFines, setMemberFines] = useState([]);

    useEffect(() => {
        fetchPayments();
        fetchMembers();
    }, []);

    const fetchPayments = async () => {
        try {
            setLoading(true);
            const res = await api.get('/unallocated');
            setPayments(res.data);
        } catch (error) {
            console.error('Failed to fetch unallocated payments', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchMembers = async () => {
        try {
            const res = await api.get('/member');
            setMembers(res.data);
        } catch (error) {
            console.error('Failed to fetch members', error);
        }
    };

    const fetchMemberDetails = async (mId: string) => {
        if (!mId) return;
        try {
            const res = await api.get(`/chama/portfolio/${mId}`);
            setMemberLoans(res.data.activeLoans || []);
            setMemberFines(res.data.pendingFines || []);
        } catch (error) {
            console.error('Failed to fetch member portfolio', error);
        }
    };

    const handleMemberSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const value = e.target.value;
        setMemberId(value);
        fetchMemberDetails(value);
        setTargetId('');
    };

    const handleTargetTypeSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const value = e.target.value;
        setTargetType(value);
        setTargetId('');
    };

    const openAllocationModal = (payment: any) => {
        setSelectedPayment(payment);
        setIsModalOpen(true);
        setMemberId('');
        setTargetType('CONTRIBUTION');
        setTargetId('');
        setMemberLoans([]);
        setMemberFines([]);
    };

    const submitAllocation = async () => {
        if (!memberId) return alert('Select a member');
        if ((targetType === 'LOAN' || targetType === 'FINE') && !targetId) {
            return alert(`Select a ${targetType.toLowerCase()} to pay`);
        }

        try {
            setAllocating(true);
            await api.post(`/unallocated/${selectedPayment.id}/allocate`, {
                memberId: parseInt(memberId),
                targetType,
                targetId: targetId ? parseInt(targetId) : null,
            });
            setIsModalOpen(false);
            fetchPayments();
        } catch (error) {
            console.error(error);
            alert('Failed to allocate payment');
        } finally {
            setAllocating(false);
        }
    };

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">Unallocated Payments</h1>
            <p className="text-sm text-gray-500">
                These payments were received directly into the bank account (e.g. KCB IPN) without enough details to map them automatically. Please assign them manually to balance the ledger.
            </p>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                    <h2 className="font-semibold text-gray-900">Pending Allocations</h2>
                </div>
                <div className="p-0 overflow-x-auto">
                    {loading ? (
                        <div className="flex justify-center p-8">
                            <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
                        </div>
                    ) : (
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-50 text-gray-500 text-xs uppercase font-semibold">
                                <tr>
                                    <th className="px-6 py-4">Date</th>
                                    <th className="px-6 py-4">Reference</th>
                                    <th className="px-6 py-4">Amount (KES)</th>
                                    <th className="px-6 py-4">Sender Phone</th>
                                    <th className="px-6 py-4 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {payments.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                                            No unallocated payments found.
                                        </td>
                                    </tr>
                                ) : (
                                    payments.map((p: any) => (
                                        <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4">{new Date(p.createdAt).toLocaleDateString()}</td>
                                            <td className="px-6 py-4 font-mono text-gray-600">{p.mpesaReceiptNumber}</td>
                                            <td className="px-6 py-4 font-semibold text-green-600">
                                                {p.amount.toLocaleString()}
                                            </td>
                                            <td className="px-6 py-4 text-gray-600">{p.phoneNumber || 'N/A'}</td>
                                            <td className="px-6 py-4 text-right">
                                                <button 
                                                    onClick={() => openAllocationModal(p)}
                                                    className="inline-flex items-center justify-center rounded-lg bg-brand-50 px-3 py-1.5 text-sm font-semibold text-brand-700 transition-colors hover:bg-brand-100"
                                                >
                                                    <Link className="h-4 w-4 mr-1.5" /> Allocate
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            <Modal 
                isOpen={isModalOpen} 
                onClose={() => setIsModalOpen(false)}
                title="Allocate Payment"
            >
                <div className="space-y-4 pt-4">
                    <p className="text-sm text-gray-600">
                        Assign this payment of <strong className="text-green-600 font-semibold">KES {selectedPayment?.amount?.toLocaleString()}</strong> to a member.
                    </p>

                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-gray-700">Member</label>
                        <select 
                            value={memberId} 
                            onChange={handleMemberSelect}
                            className="w-full rounded-lg border-gray-300 shadow-sm focus:border-brand-500 focus:ring-brand-500 sm:text-sm p-2.5 border"
                        >
                            <option value="">Select Member</option>
                            {members.map((m: any) => (
                                <option key={m.id} value={m.id.toString()}>{m.fullName}</option>
                            ))}
                        </select>
                    </div>

                    {memberId && (
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-gray-700">Payment Target</label>
                            <select 
                                value={targetType} 
                                onChange={handleTargetTypeSelect}
                                className="w-full rounded-lg border-gray-300 shadow-sm focus:border-brand-500 focus:ring-brand-500 sm:text-sm p-2.5 border"
                            >
                                <option value="CONTRIBUTION">Regular Contribution</option>
                                <option value="LOAN">Loan Repayment</option>
                                <option value="FINE">Fine Payment</option>
                            </select>
                        </div>
                    )}

                    {targetType === 'LOAN' && memberId && (
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-gray-700">Select Loan</label>
                            <select 
                                value={targetId} 
                                onChange={(e) => setTargetId(e.target.value)}
                                className="w-full rounded-lg border-gray-300 shadow-sm focus:border-brand-500 focus:ring-brand-500 sm:text-sm p-2.5 border"
                            >
                                <option value="">Select a loan to repay</option>
                                {memberLoans.map((loan: any) => (
                                    <option key={loan.id} value={loan.id.toString()}>
                                        {loan.product?.name} - Bal: KES {loan.balance?.toLocaleString()}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    {targetType === 'FINE' && memberId && (
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-gray-700">Select Fine</label>
                            <select 
                                value={targetId} 
                                onChange={(e) => setTargetId(e.target.value)}
                                className="w-full rounded-lg border-gray-300 shadow-sm focus:border-brand-500 focus:ring-brand-500 sm:text-sm p-2.5 border"
                            >
                                <option value="">Select a fine to pay</option>
                                {memberFines.map((fine: any) => (
                                    <option key={fine.id} value={fine.id.toString()}>
                                        {fine.rule?.name} - Bal: KES {fine.balance?.toLocaleString()}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-gray-100">
                        <button 
                            type="button"
                            onClick={() => setIsModalOpen(false)}
                            className="rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors border border-gray-200"
                        >
                            Cancel
                        </button>
                        <button 
                            onClick={submitAllocation} 
                            disabled={allocating || !memberId}
                            className="inline-flex items-center justify-center rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 disabled:opacity-50 transition-colors"
                        >
                            {allocating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Confirm Allocation
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
