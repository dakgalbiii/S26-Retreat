"use client";
import Link from "next/link";
import { useState } from "react";

type Props = { now: Date };

export default function InfoTab({ now }: Props) {
    return (
        <div className="px-7 pt-12 pb-28">
            <div className="fade-up delay-1 mb-11">
                <p className="text-[10px] tracking-widest2 uppercase text-brown/30 mb-1">
                    Retreat info
                </p>
                <h2 className="text-[32px] font-medium tracking-tight text-brown leading-none">
                    Info
                </h2>
            </div>

            {/* Location */}
            <div className="fade-up delay-2 mb-10">
                <p className="text-[12px] tracking-widest2 uppercase text-brown/30 mb-4">
                    Location
                </p>

                <div className="flex gap-5 mb-4">
                    <span className="text-[12px] font-bold text-brown/20 tabular-nums pt-[2px] w-5 shrink-0">01</span>
                    <div>
                        <p className="text-[16px] font-medium text-brown mb-0.5">NJCA</p>
                        <p className="text-[12px] text-brown/45 font-light leading-relaxed">
                            73 Holmes Mill Rd<br />Cream Ridge, NJ 08514
                        </p>
                        <Link
                            href="https://maps.apple.com/?q=73+Holmes+Mill+Rd,+Cream+Ridge,+NJ+08514"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-block mt-2 text-[11px] text-brown/40 hover:text-brown/70 transition-colors"
                        >
                            Open in Maps →
                        </Link>
                    </div>
                </div>

                {/* Embedded map */}
                <div className="rounded-sm overflow-hidden border border-brown/10 mt-3">
                    <iframe
                        title="NJCA location"
                        width="100%"
                        height="200"
                        style={{ border: 0, display: "block" }}
                        loading="lazy"
                        src="https://www.openstreetmap.org/export/embed.html?bbox=-74.507%2C40.119%2C-74.497%2C40.129&layer=mapnik&marker=40.124%2C-74.502"
                    />
                </div>
            </div>

            {/* Contacts */}
            <div className="fade-up delay-3">
                <p className="text-[12px] tracking-widest2 uppercase text-brown/30 mb-4">
                    Contact
                </p>

                <div className="flex flex-col">
                    {[
                        { num: "02", role: "President", name: "Michael Tso", phone: "516-289-2223" },
                        { num: "03", role: "Vice President", name: "Sharon Park", phone: "929-422-4950" },
                    ].map(({ num, role, name, phone }) => (
                        <div
                            key={name}
                            className="flex gap-5 py-6 border-b border-brown/[0.07] last:border-0"
                        >
                            <span className="text-[12px] font-bold text-brown/20 tabular-nums pt-[2px] w-5 shrink-0">
                                {num}
                            </span>
                            <div className="flex-1">
                                <p className="text-[12px] tracking-widest2 uppercase text-brown/30 mb-1">
                                    {role}
                                </p>
                                <p className="text-[13px] font-medium text-brown mb-[2px]">{name}</p>
                                <a
                                    href={`tel:${phone.replace(/-/g, "")}`}
                                    className="text-[12px] text-brown/45 font-light hover:text-brown/70 transition-colors"
                                >
                                    {phone}
                                </a>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Emergency note */}
            <div className="fade-up delay-3 mt-10 flex items-start gap-3 p-4 border border-brown/10 rounded-sm">
                <p className="text-[11px] text-brown/40 leading-relaxed font-light">
                    In a legitimate emergency, please reach out to a leader immediately.
                </p>
            </div>

            {/* Retreat Extras - moved to bottom */}
            <div className="fade-up delay-4 mt-16">
                <p className="text-[12px] tracking-widest2 uppercase text-brown/30 mb-4">
                    Extras
                </p>

                {/* Spotify Playlist */}
                <div className="flex gap-5 mb-6">
                    <span className="text-[12px] font-bold text-brown/20 tabular-nums pt-[2px] w-5 shrink-0">04</span>
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                            <p className="text-[16px] font-medium text-brown">Retreat Playlist</p>
                        </div>
                        <p className="text-[14px] text-brown/45 font-light leading-relaxed mb-3">
                            Songs our praise team has prepared for the retreat
                        </p>
                        <Link
                            href="https://open.spotify.com/playlist/6ZdA97XWRvREv1a307Jnr8?si=DgLHaHj6Sbi6_JRprhaAww&pi=EglWKHWjRzGea"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 text-[11px] text-brown/40 hover:text-brown/70 transition-colors"
                        >
                            <span>Listen on Spotify</span>
                        </Link>
                    </div>
                </div>

                {/* Photo Gallery */}
                <div className="flex gap-5">
                    <span className="text-[12px] font-bold text-brown/20 tabular-nums pt-0.5 w-5 shrink-0">05</span>
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                            <p className="text-[16px] font-medium text-brown">Photo Gallery</p>
                        </div>
                        <p className="text-[14px] text-brown/45 font-light leading-relaxed mb-3">
                            Retreat photos & memories 
                            <span className="text-[12px]">&nbsp;(Download PIN: 2533)</span>
                        </p>
                        <Link
                            href="https://notesbyshin.pixieset.com/kcfspringretreat2026/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 text-[11px] text-brown/40 hover:text-brown/70 transition-colors"
                        >
                            <span>View Gallery</span>
                            
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}