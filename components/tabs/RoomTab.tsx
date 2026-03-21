"use client";

import { useState, useMemo } from "react";
import { Users, BedDouble, Bath, Search, X, Mars, Venus } from "lucide-react";

type Room = {
    name: string;
    capacity: number;
    occupants: string[];
    gender?: string;
};

type Area = {
    name: string;
    location: string;
    rooms: Room[];
    totalCapacity: number;
    totalFilled: number;
};

const ROOMS_DATA: Area[] = [
    {
        name: "Main Chapel",
        location: "Upstairs",
        totalCapacity: 34,
        totalFilled: 30,
        rooms: [
            {
                name: "Hallelujah",
                capacity: 10,
                occupants: ["Elijah Kim", "Joshua Lee", "Alvin Shin (F)", "Eason Chiu", "Brian Song", "Daniel Choi", "Brendon Park"],
                gender: "Male",
            },
            {
                name: "Canaan",
                capacity: 6,
                occupants: ["Sharon Park", "Sophia Kim", "Lina Kim", "Gloria Cho", "Lora Lee", "Lia Hwang"],
                gender: "Female",
            },
            {
                name: "Nazareth",
                capacity: 6,
                occupants: ["Leah Jun", "Rae Kim", "Abellia Kim", "Saebin Jung", "Esther Song", "Chenny Kang"],
                gender: "Female",
            },
            {
                name: "Damascus",
                capacity: 6,
                occupants: ["Nana Kim", "Catherine Park", "Alexis Kim", "Selena Xie", "Lisa Kim"],
                gender: "Female"
            },
            {
                name: "Immanuel",
                capacity: 6,
                occupants: ["Michael Tso", "Elliot Bae", "John Choi", "Caleb Park", "Ronan Malga", "Joshua Ra and Thomas Kang"],
                gender: "Male"
            }
        ]
    },
    {
        name: "Agape",
        location: "Downstairs",
        totalCapacity: 16,
        totalFilled: 19,
        rooms: [
            {
                name: "101",
                capacity: 4,
                occupants: ["Matty Yoon", "Ethan Kim", "Neyf", "Jeremy Kim"],
                gender: "Male"
            },
            {
                name: "102",
                capacity: 4,
                occupants: ["Alvin Shin (J)", "Daniel HR", "Ryder Min", "David Sung"],
                gender: "Male"
            },
            {
                name: "103",
                capacity: 4,
                occupants: ["Nathan Im", "Steven Quan", "Josh Joung", "Josh Choi"],
                gender: "Male"
            },
            {
                name: "104",
                capacity: 4,
                occupants: ["Wesley Park", "Timothy Ha", "Andrew Son", "Isaac Kim"],
                gender: "Male"
            },
            {
                name: "105",
                capacity: 3,
                occupants: ["Sam Timaran", "Matthew Na", "Brandon Park"],
                gender: "Male"
            },
            {
                name: "106",
                capacity: 4,
                occupants: []
            },
            {
                name: "107",
                capacity: 4,
                occupants: []
            },
            {
                name: "108",
                capacity: 4,
                occupants: []
            },
            {
                name: "109",
                capacity: 4,
                occupants: []
            },
            {
                name: "Bathroom",
                capacity: 0,
                occupants: []
            }
        ]
    }
];

export default function RoomsTab() {
    const [selectedArea, setSelectedArea] = useState<string>("Main Chapel");
    const [searchQuery, setSearchQuery] = useState<string>("");

    const currentArea = ROOMS_DATA.find(area => area.name === selectedArea) || ROOMS_DATA[0];

    // Filter rooms based on search query
    const filteredRooms = useMemo(() => {
        if (!searchQuery.trim()) return currentArea.rooms;

        const query = searchQuery.toLowerCase().trim();
        return currentArea.rooms.map(room => ({
            ...room,
            occupants: room.occupants.filter(person => 
                person.toLowerCase().includes(query)
            )
        })).filter(room => 
            room.occupants.length > 0 || 
            room.name.toLowerCase().includes(query) ||
            (room.gender && room.gender.toLowerCase().includes(query))
        );
    }, [currentArea.rooms, searchQuery]);

    const handleClearSearch = () => setSearchQuery("");

    // Gender indicator component
    const GenderIndicator = ({ gender }: { gender?: string }) => {
        if (!gender) return null;
        
        const isMale = gender.toLowerCase() === "male";
        return (
            <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-medium ${
                isMale 
                    ? 'bg-blue-100 text-blue-700' 
                    : 'bg-pink-100 text-pink-700'
            }`}>
                {isMale ? <Mars size={10} /> : <Venus size={10} />}
                <span>{gender}</span>
            </div>
        );
    };

    return (
        <div className="px-7 pt-12 pb-28">
            {/* Header */}
            <div className="fade-up delay-1 mb-8">
                <p className="text-[10px] tracking-widest2 uppercase text-brown/30 mb-1">
                    Retreat lodging
                </p>
                <h2 className="text-[32px] font-medium tracking-tight text-brown leading-none mb-3">
                    Rooms
                </h2>

                {/* Area selector */}
                <div className="flex gap-2 mt-4">
                    {ROOMS_DATA.map((area) => (
                        <button
                            key={area.name}
                            onClick={() => {
                                setSelectedArea(area.name);
                                setSearchQuery(""); // Clear search when switching areas
                            }}
                            className={`flex-1 py-3 rounded-lg transition-all ${
                                selectedArea === area.name
                                    ? 'bg-[#594334] text-[#f2ede4]'
                                    : 'bg-brown/5 text-brown/50 hover:bg-brown/10'
                            }`}
                        >
                            <span className="text-xs font-medium">{area.name}</span>
                            <span className="text-[10px] block opacity-60">{area.location}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Search bar */}
            <div className="fade-up delay-2 mb-6">
                <div className="relative">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-brown/30" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search for a name, room, or gender..."
                        className="w-full pl-10 pr-10 py-3 text-sm bg-brown/5 border border-brown/10 rounded-lg focus:outline-none focus:border-brown/30 text-brown placeholder:text-brown/30"
                    />
                    {searchQuery && (
                        <button
                            onClick={handleClearSearch}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-brown/30 hover:text-brown/50"
                        >
                            <X size={16} />
                        </button>
                    )}
                </div>
                
                {/* Search results count */}
                {searchQuery && (
                    <p className="text-xs text-brown/40 mt-2">
                        Found {filteredRooms.reduce((acc, room) => acc + room.occupants.length, 0)} matching results
                    </p>
                )}
            </div>

            {/* Rooms grid */}
            <div className="fade-up delay-3 space-y-4">
                {filteredRooms.map((room, idx) => {
                    if (room.name === "Bathroom") {
                        return (
                            <div key={room.name} className="flex items-center gap-3 p-3 bg-brown/5 rounded-lg opacity-60">
                                <Bath size={16} className="text-brown/30" />
                                <span className="text-xs text-brown/40">{room.name}</span>
                            </div>
                        );
                    }

                    const filledCount = room.occupants.length;
                    const isEmpty = filledCount === 0;

                    return (
                        <div
                            key={room.name}
                            className={`border rounded-lg overflow-hidden transition-all ${
                                isEmpty ? 'border-brown/10 opacity-50' : 'border-brown/20'
                            }`}
                        >
                            {/* Room header */}
                            <div className="flex items-center justify-between px-4 py-3 bg-brown/5">
                                <div className="flex items-center gap-2">
                                    <BedDouble size={16} className="text-brown/40" />
                                    <span className="font-medium text-brown">Room {room.name}</span>
                                </div>
                                <GenderIndicator gender={room.gender} />
                            </div>

                            {/* Occupants list */}
                            {room.occupants.length > 0 && (
                                <div className="px-4 py-3 space-y-1.5">
                                    {room.occupants.map((person, i) => {
                                        // Highlight matching text if searching
                                        const isMatch = searchQuery && 
                                            person.toLowerCase().includes(searchQuery.toLowerCase());
                                        
                                        return (
                                            <div 
                                                key={i} 
                                                className={`flex items-center gap-2 ${
                                                    isMatch ? 'bg-gold/10 -mx-2 px-2 py-1 rounded' : ''
                                                }`}
                                            >
                                                <span className="w-1 h-1 rounded-full bg-brown/20" />
                                                <span className="text-sm text-brown/80">
                                                    {isMatch ? (
                                                        <>
                                                            {person.split(new RegExp(`(${searchQuery})`, 'gi')).map((part, j) => 
                                                                part.toLowerCase() === searchQuery.toLowerCase() ? (
                                                                    <span key={j} className="bg-gold/30 font-medium">{part}</span>
                                                                ) : (
                                                                    <span key={j}>{part}</span>
                                                                )
                                                            )}
                                                        </>
                                                    ) : (
                                                        person
                                                    )}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            {/* Empty room indicator */}
                            {room.occupants.length === 0 && room.capacity > 0 && (
                                <div className="px-4 py-3">
                                    <p className="text-xs text-brown/30 italic">No occupants assigned</p>
                                </div>
                            )}
                        </div>
                    );
                })}

                {/* No results message */}
                {searchQuery && filteredRooms.length === 0 && (
                    <div className="text-center py-12">
                        <p className="text-sm text-brown/30">No rooms or people match your search</p>
                    </div>
                )}
            </div>

            {/* Legend */}
            <div className="fade-up delay-4 mt-8 flex items-center justify-center gap-4 text-xs text-brown/30">
                <div className="flex items-center gap-1">
                    <Mars size={12} className="text-blue-400" />
                    <span>Male</span>
                </div>
                <div className="flex items-center gap-1">
                    <Venus size={12} className="text-pink-400" />
                    <span>Female</span>
                </div>
                <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-gold/60" />
                    <span>Full</span>
                </div>
                <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-brown/20" />
                    <span>Available</span>
                </div>
            </div>
        </div>
    );
}