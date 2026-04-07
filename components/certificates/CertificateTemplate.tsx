'use client';

import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
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

            {/* Ornante Border Simulation using nested divs */}
            <div className="absolute inset-4 border border-[#4a5d23] pointer-events-none rounded-sm"></div>
            <div className="absolute inset-[22px] border-[2px] border-[#4a5d23] pointer-events-none rounded-sm"></div>

            {/* Corner Ornaments (Simple SVG) */}
            <div className="absolute top-4 left-4 w-10 h-10 pointer-events-none">
                <svg viewBox="0 0 100 100" fill="none" stroke="#4a5d23" strokeWidth="2">
                    <path d="M 10 100 Q 10 10 100 10" />
                    <path d="M 20 100 Q 20 20 100 20" />
                </svg>
            </div>
            <div className="absolute top-4 right-4 w-10 h-10 pointer-events-none" style={{ transform: 'scaleX(-1)' }}>
                <svg viewBox="0 0 100 100" fill="none" stroke="#4a5d23" strokeWidth="2">
                    <path d="M 10 100 Q 10 10 100 10" />
                    <path d="M 20 100 Q 20 20 100 20" />
                </svg>
            </div>
            <div className="absolute bottom-4 left-4 w-10 h-10 pointer-events-none" style={{ transform: 'scaleY(-1)' }}>
                <svg viewBox="0 0 100 100" fill="none" stroke="#4a5d23" strokeWidth="2">
                    <path d="M 10 100 Q 10 10 100 10" />
                    <path d="M 20 100 Q 20 20 100 20" />
                </svg>
            </div>
            <div className="absolute bottom-4 right-4 w-10 h-10 pointer-events-none" style={{ transform: 'scale(-1, -1)' }}>
                <svg viewBox="0 0 100 100" fill="none" stroke="#4a5d23" strokeWidth="2">
                    <path d="M 10 100 Q 10 10 100 10" />
                    <path d="M 20 100 Q 20 20 100 20" />
                </svg>
            </div>

            <div className="relative z-10 flex flex-col items-center h-full pt-8 pb-8 px-12">

                {/* Top Header Section with balanced flex layout */}
                <div className="w-full flex justify-between items-start">
                    
                    {/* QR Code Container - Left */}
                    <div className="w-28 flex flex-col items-center border border-gray-300 bg-white p-2 text-[10px] mt-4 shadow-sm">
                        <QRCodeSVG value={verifyUrl} size={64} level="L" />
                        <span className="font-bold mt-1 text-center leading-tight">Scan to Verify</span>
                        <span className="font-bold border-b border-black w-full text-center pb-0.5 mb-0.5 mt-1">{data.certificateNo || 'N/A'}</span>
                        <span className="font-bold">{data.refNo || 'N/A'}</span>
                    </div>

                    {/* Center Headers */}
                    <div className="flex flex-col items-center flex-1">
                        {/* Bismillah Calligraphy */}
                        <div className="text-3xl mb-4 text-[#4a5d23]" style={{ fontFamily: 'Arial, sans-serif' }}>
                            ﷽
                        </div>

                        {/* TMJ Logo Simulation */}
                        <div className="flex flex-col items-center mb-4">
                            <svg width="50" height="50" viewBox="0 0 100 100" className="mb-2">
                                <circle cx="50" cy="50" r="45" fill="none" stroke="#4a5d23" strokeWidth="2" />
                                <circle cx="50" cy="50" r="38" fill="none" stroke="#4a5d23" strokeWidth="1" strokeDasharray="4 4" />
                                <path d="M 45 35 A 15 15 0 1 0 65 55 A 20 20 0 1 1 45 35 Z" fill="#4a5d23" />
                                <polygon points="62,38 65,45 72,45 66,50 68,57 62,53 56,57 58,50 52,45 59,45" fill="#4a5d23" transform="scale(0.6) translate(40, 20)" />
                            </svg>
                            
                            {/* Header Texts */}
                            <div className="text-center space-y-1">
                                <h1 className="text-2xl font-bold tracking-widest text-[#2a3618] uppercase" style={{ fontFamily: 'monospace' }}>TMJ</h1>
                                <p className="text-lg text-[#2a3618]" style={{ fontFamily: 'Malayalam MN, system-ui' }}>തായിനേരി മുസ്ലിം ജമാഅത്ത്</p>
                            </div>
                        </div>
                    </div>

                    {/* Right spacer for perfect center alignment of the logo */}
                    <div className="w-28"></div>
                </div>

                {/* Title and Lines */}
                <div className="w-full flex justify-center mt-2 mb-8 relative">
                    <div className="absolute w-full h-[1px] bg-[#4a5d23]/40 top-0"></div>
                    <div className="absolute w-full h-[1px] bg-[#4a5d23]/40 top-[3px]"></div>
                    
                    <div className="text-center pt-4">
                        <h2 className="text-2xl font-bold text-[#1f2911]" style={{ fontFamily: '"Cinzel", serif' }}>Official Nikah Certificate</h2>
                        <h3 className="text-lg font-medium mt-1 text-[#4a5d23]" style={{ fontFamily: 'Malayalam MN, system-ui' }}>നികാഹ് (വിവാഹ) സർട്ടിഫിക്കറ്റ്</h3>
                    </div>
                    
                    <div className="absolute w-full h-[1px] bg-[#4a5d23]/40 bottom-0"></div>
                    <div className="absolute w-full h-[1px] bg-[#4a5d23]/40 bottom-[3px]"></div>
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

                        {/* Official Seal Mockup (Absolute positioned) */}
                        <div className="absolute -bottom-8 right-2 w-32 h-32 flex items-center justify-center pointer-events-none opacity-85">
                            <div className="w-full h-full rounded-full border-[3px] border-[#2c3e50] flex items-center justify-center relative">
                                <div className="absolute w-[92%] h-[92%] rounded-full border border-dashed border-[#2c3e50]"></div>
                                {/* Circular text simulation */}
                                <svg viewBox="0 0 100 100" className="absolute w-full h-full text-[#2c3e50]">
                                    <path id="curve" d="M 15 50 A 35 35 0 1 1 15 50.01" fill="transparent" />
                                    <text fontSize="8" fontWeight="bold" letterSpacing="1.5" fontFamily="Arial">
                                        <textPath href="#curve" startOffset="0%">
                                            THAYINERI JAMA - ATH * SEAL *
                                        </textPath>
                                    </text>
                                </svg>
                                {/* Center graphic */}
                                <div className="text-center mt-1">
                                    <div className="text-[#2c3e50] font-bold text-sm tracking-widest">OFFICIAL</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Signatures at the bottom */}
                <div className="w-full flex justify-between items-end mt-auto pt-10 px-4">
                    {renderSig("Signature of Groom")}
                    {renderSig("Signature of Bride")}
                    {renderSig("Signature of Imam")}
                </div>

            </div>
        </div>
    );
}
