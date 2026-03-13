"use client";

import { useState } from "react";
import { Users, BedDouble, Bath } from "lucide-react";

type Room = {
  name: string;
  capacity: number;
  occupants: string[];
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
        occupants: ["Elijah Kim", "Joshua Lee", "Alvin Shin F", "Eason Chiu", "Brian Song", "Daniel Choi", "Brendon Park"]
      },
      {
        name: "Canaan",
        capacity: 6,
        occupants: ["Sharon Park", "Sophia Kim", "Lina Kim", "Gloria Cho", "Lora Lee", "Lia Hwang"]
      },
      {
        name: "Nazareth",
        capacity: 6,
        occupants: ["Leah Jun", "Rae Kim", "Abellia Kim", "Saebin Jung", "Esther Song", "Chenny Kang"]
      },
      {
        name: "Damascus",
        capacity: 6,
        occupants: ["Nana Kim", "Catherine Park", "Alexis Kim", "Selena Xie", "Lisa Kim"]
      },
      {
        name: "Immanuel",
        capacity: 6,
        occupants: ["Michael Tso", "Elliot Bae", "John Choi", "Caleb Park", "Ronan Malga", "Joshua Ra and Thomas Kang"]
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
        occupants: ["Matty Yoon", "Ethan Kim", "Neyf", "Jeremy Kim"]
      },
      {
        name: "102",
        capacity: 4,
        occupants: ["Alvin Shin", "Daniel HR", "Ryder Min", "David Sung"]
      },
      {
        name: "103",
        capacity: 4,
        occupants: ["Nathan Im", "Steven Quan", "Josh Joung", "Josh Choi"]
      },
      {
        name: "104",
        capacity: 4,
        occupants: ["Wesley Park", "Timothy Ha", "Andrew Son", "Isaac Kim"]
      },
      {
        name: "105",
        capacity: 3,
        occupants: ["Sam Timaran", "Matthew Na", "Brandon Park"]
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

  const currentArea = ROOMS_DATA.find(area => area.name === selectedArea) || ROOMS_DATA[0];

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
              onClick={() => setSelectedArea(area.name)}
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

      {/* Area stats */}
      <div className="fade-up delay-2 mb-6">
        {/* <div className="flex items-center justify-between p-4 bg-brown/5 rounded-lg">
          <div className="flex items-center gap-3">
            <Users size={18} className="text-brown/40" />
            <div>
              <p className="text-xs text-brown/40">Occupancy</p>
              <p className="text-lg font-medium text-brown">
                {currentArea.totalFilled} <span className="text-sm text-brown/30">/ {currentArea.totalCapacity}</span>
              </p>
            </div>
          </div>
          <div className="h-8 w-px bg-brown/10" />
          <div className="text-right">
            <p className="text-xs text-brown/40">Rooms</p>
            <p className="text-lg font-medium text-brown">{currentArea.rooms.filter(r => r.capacity > 0).length}</p>
          </div>
        </div> */}
      </div>

      {/* Rooms grid */}
      <div className="fade-up delay-3 space-y-4">
        {currentArea.rooms.map((room, idx) => {
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
                {/* <div className="flex items-center gap-2">
                  <span className="text-xs text-brown/40">
                    {filledCount}/{room.capacity}
                  </span>
                  {filledCount === room.capacity && (
                    <span className="text-[10px] px-2 py-0.5 bg-gold/20 text-gold rounded-full">
                      FULL
                    </span>
                  )}
                </div> */}
              </div>

              {/* Occupants list */}
              {room.occupants.length > 0 && (
                <div className="px-4 py-3 space-y-1.5">
                  {room.occupants.map((person, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className="w-1 h-1 rounded-full bg-brown/20" />
                      <span className="text-sm text-brown/80">{person}</span>
                    </div>
                  ))}
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
      </div>

      {/* Legend */}
      <div className="fade-up delay-4 mt-8 flex items-center justify-center gap-4 text-xs text-brown/30">
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