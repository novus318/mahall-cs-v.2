'use client';

import { format } from 'date-fns';

interface NikahCertificateTemplateProps {
    data: any;
}

export default function NikahCertificateTemplate({ data }: NikahCertificateTemplateProps) {
    if (!data) return null;

    const renderRow = (label: string, value: string, width?: string) => (
        <div className={`flex items-end ${width || 'w-full'}`}>
            <span className="mr-3 font-semibold whitespace-nowrap">{label}</span>
            <div className="flex-1 border-b border-gray-400 text-center min-w-[50px] font-bold text-lg leading-tight pb-0.5">{value || '\u00A0'}</div>
        </div>
    );

    return (
        <div className="bg-white text-black p-8 relative overflow-hidden print-exact-size"
            style={{
                height: '297mm',
                width: '210mm',
                boxSizing: 'border-box',
                fontFamily: '"Playfair Display", serif'
            }}>

            <div className="absolute inset-0 bg-[#fefdfa] -z-10" />

            <div className="relative z-10 flex flex-col h-full pt-8 pb-8 px-12">

                <div className="w-full flex-1 flex flex-col gap-y-4 text-[16px] leading-relaxed relative z-10 px-4 mt-44">

                    {renderRow('Register No:', data.registerNo, 'w-1/2')}

                    <div className="mt-4">
                        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">Groom</h3>
                        {renderRow('Name:', data.groomName)}
                        {renderRow("Father's Name:", data.groomFatherName)}
                        {renderRow('Address:', data.groomAddress || '-', 'w-3/4')}
                        {renderRow('Mahall ID:', data.groomMahallId || 'N/A', 'w-1/2')}
                    </div>

                    <div className="mt-4">
                        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">Bride</h3>
                        {renderRow('Name:', data.brideName)}
                        {renderRow("Father's Name:", data.brideFatherName)}
                        {renderRow('Address:', data.brideAddress || '-', 'w-3/4')}
                        {renderRow('Mahall ID:', data.brideMahallId || 'N/A', 'w-1/2')}
                    </div>

                    <div className="mt-4">
                        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">Nikah Details</h3>
                        <div className="flex gap-4">
                            {renderRow('Date:', data.nikahDate ? format(new Date(data.nikahDate), 'dd MMMM yyyy') : '', 'w-1/2')}
                            {renderRow('Time:', data.nikahTime || '-', 'w-1/2')}
                        </div>
                        {renderRow('Place:', data.nikahPlace)}
                        {renderRow('Mahr Amount:', data.mahrAmount, 'w-1/2')}
                        {renderRow('Bride Guardian (Wali):', data.brideGuardian, 'w-3/4')}
                    </div>

                    <div className="mt-4">
                        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">Witnesses</h3>
                        {renderRow('Witness 1:', data.witness1Name, 'w-3/4')}
                        {renderRow('Witness 2:', data.witness2Name, 'w-3/4')}
                    </div>

                    <div className="mt-4">
                        {renderRow('Qazi / Imam:', data.qaziName, 'w-3/4')}
                    </div>

                    {data.remarks && (
                        <div className="mt-4">
                            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">Remarks</h3>
                            <div className="text-sm italic text-gray-700">{data.remarks}</div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
