'use client';

import { format } from 'date-fns';

interface CertificateTemplateProps {
    data: any;
}

export default function CertificateTemplate({ data }: CertificateTemplateProps) {
    if (!data) return null;

    // URL to verify the certificate
    const verifyUrl = typeof window !== 'undefined' ? `${window.location.origin}/verify/${data.certificateNo?.replace('/', '-')}` : '';

    // Dynamic Field Renderer
    const renderRow = (label: string, value: string, width?: string) => (
        <div className={`flex items-end ${width ? width : 'w-full'}`}>
            <span className="mr-3 font-semibold whitespace-nowrap">{label}</span>
            <div className="flex-1 border-b border-gray-400 text-center min-w-[50px] font-bold text-lg leading-tight pb-0.5">{value || '\u00A0'}</div>
        </div>
    );

    const renderSig = (label: string) => (
        <div className="flex flex-col items-center">
            <div className="w-48 border-b border-gray-400 mb-1"></div>
            <span className="text-sm font-semibold italic text-gray-600">{label}</span>
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

            {/* Background Texture/Color (Subtle off-white) */}
            <div className="absolute inset-0 bg-[#fefdfa] -z-10" />

            {/* Rejected Watermark */}
            {data.status === 'Rejected' && (
                <div className="absolute inset-0 z-50 flex items-center justify-center pointer-events-none overflow-hidden">
                    <div className="transform -rotate-45 text-red-500/20 font-black text-[120px] tracking-widest border-8 border-red-500/20 px-8 py-4 rounded-xl">
                        REJECTED
                    </div>
                </div>
            )}



            {/* Corner Ornaments (Simple SVG) */}
            <div className="absolute top-4 left-4 w-10 h-10 pointer-events-none">
                        </div>
            <div className="absolute top-4 right-4 w-10 h-10 pointer-events-none" style={{ transform: 'scaleX(-1)' }}>
              
            </div>
            <div className="absolute bottom-4 left-4 w-10 h-10 pointer-events-none" style={{ transform: 'scaleY(-1)' }}>
               
            </div>
            <div className="absolute bottom-4 right-4 w-10 h-10 pointer-events-none" style={{ transform: 'scale(-1, -1)' }}>
            
            </div>

            <div className="relative z-10 flex flex-col items-center h-full pt-8 pb-8 px-12">

                {/* Top Header Section with balanced flex layout */}
                <div className="w-full flex justify-between items-start">
                    
                    {/* QR Code Container - Left */}
                    <div className="w-28 flex flex-col items-center p-2 text-[10px] mt-4">
                   
                    </div>

                    {/* Center Headers */}
                    <div className="flex flex-col items-center flex-1">
                        {/* Bismillah Calligraphy */}
                        <div className="text-3xl mb-4 text-[#4a5d23]" style={{ fontFamily: 'Arial, sans-serif' }}>
                           
                        </div>

                        {/* TMJ Logo Simulation */}
                        <div className="flex flex-col items-center mb-4">
                          
                            
                            {/* Header Texts */}
                            <div className="text-center space-y-1">
                                <h1 className="text-2xl font-bold tracking-widest text-[#2a3618] uppercase" style={{ fontFamily: 'monospace' }}></h1>
                                <p className="text-lg text-[#2a3618]" style={{ fontFamily: 'Malayalam MN, system-ui' }}></p>
                            </div>
                        </div>
                    </div>

                    {/* Right spacer for perfect center alignment of the logo */}
                    <div className="w-28"></div>
                </div>

                {/* Title and Lines */}
                <div className="w-full flex justify-center mt-48 mb-8 relative">
                    
    
                </div>

                {/* Main Content Area */}
                <div className="w-full flex-1 flex flex-col gap-y-4 text-[16px] leading-relaxed relative z-10 px-4">

                    {/* Row 1: Groom */}
                    {renderRow("Groom Name:", data.groomName)}
                    {renderRow("Father Name:", data.groomFatherName)}
                    {renderRow("Mahall ID:", data.groomMahallId || "N/A", "w-2/3")}

                    {/* Row 2: Bride */}
                    <div className="mt-2"></div>
                    {renderRow("Bride Name:", data.brideName)}
                    {renderRow("Father Name:", data.brideFatherName)}
                    {renderRow("Mahall ID:", data.brideMahallId || "N/A", "w-2/3")}

                    {/* Row 3: Nikah Details */}
                    <div className="mt-2"></div>
                    <div className="flex gap-4">
                        {renderRow("Date of Nikah:", data.nikahDate ? format(new Date(data.nikahDate), 'dd MMMM yyyy') : '', "w-1/2")}
                        {renderRow("Mahr:", data.mahr, "w-1/2")}
                    </div>
                    {renderRow("Place of Nikah:", data.nikahPlace)}

                    {/* Row 4: Witnesses */}
                    <div className="mt-2"></div>
                    {renderRow("Witness 1:", data.witness1, "w-[85%]")}
                    {renderRow("Witness 2:", data.witness2, "w-[85%]")}

                    <div className="mt-6 text-right relative h-10 w-full flex justify-end">
                        <div className="w-[75%] flex items-end justify-start">
                            <span className="mr-3 font-semibold whitespace-nowrap">Name of Qazi / Imam:</span>
                            <div className="flex-1 border-b border-gray-400 text-center font-bold text-lg leading-tight pb-0.5">{data.qaziName}</div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
