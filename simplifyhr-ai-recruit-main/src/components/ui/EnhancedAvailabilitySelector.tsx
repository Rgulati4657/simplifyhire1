// import { useState, useMemo } from 'react';
// import {
//   format,
//   startOfWeek,
//   addDays,
//   setHours,
//   setMinutes,
//   setSeconds,
//   addWeeks,
//   subWeeks,
//   isBefore,
//   startOfToday,
//   isWithinInterval,
//   parseISO,
//   addHours,
//   isEqual,
// } from 'date-fns';
// import { Button } from '@/components/ui/button';
// import { ChevronLeft, ChevronRight } from 'lucide-react';

// // --- DEFINE THE FULL BACKEND DATA STRUCTURE ---
// interface SlotRange {
//   start: string;
//   end: string;
// }

// interface BackendFreeSlot extends SlotRange {
//   date: string;
// }

// interface BackendOccupiedSlot extends SlotRange {
//   id: string;
//   title: string;
//   type: string;
// }

// // This is the object inside the main array
// interface AvailabilityObject {
//   free_slots: BackendFreeSlot[];
//   occupied_slots: BackendOccupiedSlot[];
// }

// // --- DEFINE THE COMPONENT'S PROPS ---
// interface EnhancedAvailabilitySelectorProps {
//   /**
//    * The initial availability data, in the exact format from the backend.
//    * It is an array containing a single object.
//    */
//   initialData: AvailabilityObject[] | null;
//   /**
//    * Callback that receives the updated data, formatted for the backend.
//    */
//   onSave: (updatedData: AvailabilityObject[]) => void;
//   /**
//    * Callback function to close the parent modal or dialog.
//    */
//   onClose: () => void;
// }

// type SlotStatus = 'Selected' | 'Occupied' | 'Available' | 'Past';

// export const EnhancedAvailabilitySelector = ({
//   initialData,
//   onSave,
//   onClose,
// }: EnhancedAvailabilitySelectorProps) => {

//   // --- 1. UNPACK THE INCOMING PROPS INTERNALLY ---
//   // This memoized value extracts the core data from the complex prop structure.
//   // The rest of the component can now work with a clean, simple object.
//   const parsedInitialData = useMemo(() => {
//     if (initialData && initialData.length > 0) {
//       return {
//         free_slots: initialData[0].free_slots || [],
//         occupied_slots: initialData[0].occupied_slots || []
//       };
//     }
//     return { free_slots: [], occupied_slots: [] };
//   }, [initialData]);

//   // Helper to break down `free_slots` ranges into individual 1-hour slots for the state.
//   const initializeSelectedSlots = (slots: SlotRange[]): Set<string> => {
//     const initialSlots = new Set<string>();
//     slots.forEach(range => {
//       let current = parseISO(range.start);
//       const end = parseISO(range.end);
//       while (isBefore(current, end)) {
//         initialSlots.add(current.toISOString());
//         current = addHours(current, 1);
//       }
//     });
//     return initialSlots;
//   };

//   const [selectedSlots, setSelectedSlots] = useState<Set<string>>(
//     initializeSelectedSlots(parsedInitialData.free_slots)
//   );

//   const [currentDate, setCurrentDate] = useState(new Date());

//   const today = useMemo(() => startOfToday(), []);
//   const weekStart = useMemo(() => startOfWeek(currentDate, { weekStartsOn: 1 }), [currentDate]);
//   const daysOfWeek = useMemo(() => Array.from({ length: 7 }).map((_, i) => addDays(weekStart, i)), [weekStart]);
//   const timeSlots = useMemo(() => Array.from({ length: 9 }).map((_, i) => `${9 + i}:00`), []); // 9 AM to 5 PM
  
//   const occupiedIntervals = useMemo(() => 
//     parsedInitialData.occupied_slots.map(slot => ({
//       start: parseISO(slot.start),
//       end: parseISO(slot.end)
//     })), [parsedInitialData.occupied_slots]
//   );

//   const getSlotStatus = (slotDate: Date): SlotStatus => {
//     if (isBefore(slotDate, today)) return 'Past';
//     const slotISO = slotDate.toISOString();
//     const isOccupied = occupiedIntervals.some(interval => isWithinInterval(slotDate, interval));
//     if (isOccupied) return 'Occupied';
//     if (selectedSlots.has(slotISO)) return 'Selected';
//     return 'Available';
//   };

//   const handleSlotClick = (day: Date, time: string) => {
//     const [hour] = time.split(':').map(Number);
//     const slotDate = setSeconds(setMinutes(setHours(day, hour), 0), 0);
//     const status = getSlotStatus(slotDate);
//     if (status === 'Past' || status === 'Occupied') return;

//     const newSelectedSlots = new Set(selectedSlots);
//     if (newSelectedSlots.has(slotDate.toISOString())) {
//       newSelectedSlots.delete(slotDate.toISOString());
//     } else {
//       newSelectedSlots.add(slotDate.toISOString());
//     }
//     setSelectedSlots(newSelectedSlots);
//   };
  
//   // --- 2. HANDLE SAVE LOGIC INTERNALLY ---
//   // This function now constructs the full, complex backend payload.
//   const handleSaveClick = () => {
//     const sortedSlots = Array.from(selectedSlots).map(parseISO).sort((a, b) => a.getTime() - b.getTime());
    
//     // Merge individual slots into clean [{start, end}] ranges
//     const mergedRanges: SlotRange[] = [];
//     if (sortedSlots.length > 0) {
//       let currentRange = { start: sortedSlots[0], end: addHours(sortedSlots[0], 1) };
//       for (let i = 1; i < sortedSlots.length; i++) {
//         if (isEqual(sortedSlots[i], currentRange.end)) {
//           currentRange.end = addHours(sortedSlots[i], 1);
//         } else {
//           mergedRanges.push({ start: currentRange.start.toISOString(), end: currentRange.end.toISOString() });
//           currentRange = { start: sortedSlots[i], end: addHours(sortedSlots[i], 1) };
//         }
//       }
//       mergedRanges.push({ start: currentRange.start.toISOString(), end: currentRange.end.toISOString() });
//     }

//     // Format the `free_slots` to include the required `date` key.
//     const formattedFreeSlots = mergedRanges.map(range => ({
//       ...range,
//       date: new Date(range.start).toISOString().split('T')[0]
//     }));

//     // Construct the final payload in the EXACT structure the backend requires.
//     const payloadForBackend: AvailabilityObject[] = [{
//       free_slots: formattedFreeSlots,
//       occupied_slots: parsedInitialData.occupied_slots // Use the original occupied slots
//     }];

//     // --- 3. CALL onSave WITH THE PERFECTLY FORMATTED DATA ---
//     onSave(payloadForBackend);
//   };
  
//   return (
//     <div className="flex flex-col gap-4 p-1">
//       {/* (The JSX for the calendar grid remains exactly the same) */}
//       <div className="flex items-center justify-between">
//         <Button variant="ghost" size="icon" onClick={() => setCurrentDate(subWeeks(currentDate, 1))}>
//           <ChevronLeft className="h-5 w-5" />
//         </Button>
//         <div className="text-lg font-semibold text-center">
//           {format(weekStart, 'MMM d')} - {format(addDays(weekStart, 6), 'MMM d, yyyy')}
//         </div>
//         <Button variant="ghost" size="icon" onClick={() => setCurrentDate(addWeeks(currentDate, 1))}>
//           <ChevronRight className="h-5 w-5" />
//         </Button>
//       </div>
//       <div className="grid grid-cols-7 gap-2">
//         {daysOfWeek.map((day) => (
//           <div key={day.toISOString()} className="text-center">
//             <div className="font-semibold">{format(day, 'E')}</div>
//             <div className="text-sm text-muted-foreground">{format(day, 'd')}</div>
//             <div className="mt-2 flex flex-col gap-1.5">
//               {timeSlots.map((time) => {
//                 const [hour] = time.split(':').map(Number);
//                 const slotDate = setSeconds(setMinutes(setHours(day, hour), 0), 0);
//                 const status = getSlotStatus(slotDate);
//                 let variant: "default" | "outline" | "destructive" = "outline";
//                 let className = "transition-colors duration-150";
//                 let disabled = false;

//                 switch (status) {
//                   case 'Selected': variant = 'default'; className += ' bg-blue-600 hover:bg-blue-700 text-white'; break;
//                   case 'Occupied': variant = 'destructive'; className += ' bg-red-200 text-red-800 cursor-not-allowed'; disabled = true; break;
//                   case 'Past': className += ' bg-muted text-muted-foreground cursor-not-allowed'; disabled = true; break;
//                 }

//                 return (
//                   <Button key={time} variant={variant} disabled={disabled} className={className} onClick={() => handleSlotClick(day, time)}>
//                     {time}
//                   </Button>
//                 );
//               })}
//             </div>
//           </div>
//         ))}
//       </div>
//       <div className="flex justify-end gap-2 pt-4">
//         <Button variant="ghost" onClick={onClose}>Cancel</Button>
//         <Button onClick={handleSaveClick}>Save Availability</Button>
//       </div>
//     </div>
//   );
// };


// import { useState, useMemo, useEffect } from 'react';
// import {
//   format,
//   startOfWeek,
//   addDays,
//   addWeeks,
//   subWeeks,
//   isBefore,
//   startOfToday,
//   isWithinInterval,
//   parseISO,
//   addHours,
//   isEqual,
// } from 'date-fns';
// import { Button } from '@/components/ui/button';
// import { ChevronLeft, ChevronRight } from 'lucide-react';

// // (All type definitions remain the same)
// interface SlotRange { start: string; end: string; }
// interface BackendFreeSlot extends SlotRange { date: string; }
// interface BackendOccupiedSlot extends SlotRange { id: string; title: string; type: string; }
// interface AvailabilityObject { free_slots: BackendFreeSlot[]; occupied_slots: BackendOccupiedSlot[]; }
// interface EnhancedAvailabilitySelectorProps {
//   initialData: AvailabilityObject[] | null;
//   onSave: (updatedData: AvailabilityObject[]) => void;
//   onClose: () => void;
// }
// type SlotStatus = 'Selected' | 'Occupied' | 'Available' | 'Past';

// export const EnhancedAvailabilitySelector = ({
//   initialData,
//   onSave,
//   onClose,
// }: EnhancedAvailabilitySelectorProps) => {

//   const parsedInitialData = useMemo(() => {
//     if (initialData && initialData.length > 0) {
//       return {
//         free_slots: initialData[0].free_slots || [],
//         occupied_slots: initialData[0].occupied_slots || []
//       };
//     }
//     return { free_slots: [], occupied_slots: [] };
//   }, [initialData]);

//   const initializeSelectedSlots = (slots: SlotRange[]): Set<string> => {
//     const initialSlots = new Set<string>();
//     slots.forEach(range => {
//       let current = parseISO(range.start);
//       const end = parseISO(range.end);
//       while (isBefore(current, end)) {
//         initialSlots.add(current.toISOString());
//         current = addHours(current, 1);
//       }
//     });
//     return initialSlots;
//   };

//   const [selectedSlots, setSelectedSlots] = useState<Set<string>>(new Set());

//   useEffect(() => {
//     const initialSlots = initializeSelectedSlots(parsedInitialData.free_slots);
//     setSelectedSlots(initialSlots);
//   }, [parsedInitialData]);

//   const [currentDate, setCurrentDate] = useState(new Date());
//   const today = useMemo(() => startOfToday(), []);
//   const weekStart = useMemo(() => startOfWeek(currentDate, { weekStartsOn: 1 }), [currentDate]);
//   const daysOfWeek = useMemo(() => Array.from({ length: 7 }).map((_, i) => addDays(weekStart, i)), [weekStart]);
//   const timeSlots = useMemo(() => Array.from({ length: 9 }).map((_, i) => `${9 + i}:00`), []);
  
//   const occupiedIntervals = useMemo(() => 
//     parsedInitialData.occupied_slots.map(slot => ({
//       start: parseISO(slot.start),
//       end: parseISO(slot.end)
//     })), [parsedInitialData.occupied_slots]
//   );
  
//   // =========================================================================
//   // --- THE DEFINITIVE FIX: Build a UTC Date from LOCAL Components ---
//   // This resolves the timezone conflict permanently.
//   // =========================================================================
//   const getUTCDateForSlot = (day: Date, time: string): Date => {
//       const [hour] = time.split(':').map(Number);
//       // We take the LOCAL year, month, and day that the user SEES on the calendar.
//       const localYear = day.getFullYear();
//       const localMonth = day.getMonth();
//       const localDay = day.getDate();
      
//       // Then, we use those LOCAL components to construct a PURE UTC timestamp.
//       const utcTimestamp = Date.UTC(localYear, localMonth, localDay, hour, 0, 0, 0);
//       return new Date(utcTimestamp);
//   };
  
//   const getSlotStatus = (slotDate: Date): SlotStatus => {
//     // This now compares a correct UTC date against the start of the user's LOCAL day.
//     if (isBefore(slotDate, today)) return 'Past';

//     const slotISO = slotDate.toISOString();
//     const isOccupied = occupiedIntervals.some(interval => isWithinInterval(slotDate, interval));
//     if (isOccupied) return 'Occupied';
//     if (selectedSlots.has(slotISO)) return 'Selected';
//     return 'Available';
//   };

//   const handleSlotClick = (day: Date, time: string) => {
//     const slotDate = getUTCDateForSlot(day, time);
//     const status = getSlotStatus(slotDate);
//     if (status === 'Past' || status === 'Occupied') return;

//     const newSelectedSlots = new Set(selectedSlots);
//     if (newSelectedSlots.has(slotDate.toISOString())) {
//       newSelectedSlots.delete(slotDate.toISOString());
//     } else {
//       newSelectedSlots.add(slotDate.toISOString());
//     }
//     setSelectedSlots(newSelectedSlots);
//   };
  
//   const handleSaveClick = () => {
//     // (This save logic is already correct and doesn't need to change)
//     const sortedSlots = Array.from(selectedSlots).map(parseISO).sort((a, b) => a.getTime() - b.getTime());
    
//     const mergedRanges: SlotRange[] = [];
//     if (sortedSlots.length > 0) {
//       let currentRange = { start: sortedSlots[0], end: addHours(sortedSlots[0], 1) };
//       for (let i = 1; i < sortedSlots.length; i++) {
//         if (isEqual(sortedSlots[i], currentRange.end)) {
//           currentRange.end = addHours(sortedSlots[i], 1);
//         } else {
//           mergedRanges.push({ start: currentRange.start.toISOString(), end: currentRange.end.toISOString() });
//           currentRange = { start: sortedSlots[i], end: addHours(sortedSlots[i], 1) };
//         }
//       }
//       mergedRanges.push({ start: currentRange.start.toISOString(), end: currentRange.end.toISOString() });
//     }

//     const formattedFreeSlots = mergedRanges.map(range => ({
//       ...range,
//       date: new Date(range.start).toISOString().split('T')[0]
//     }));

//     const payloadForBackend: AvailabilityObject[] = [{
//       free_slots: formattedFreeSlots,
//       occupied_slots: parsedInitialData.occupied_slots
//     }];
    
//     onSave(payloadForBackend);
//   };
  
//   return (
//     <div className="flex flex-col gap-4 p-1">
//         {/* (The JSX for the component remains unchanged) */}
//         <div className="flex items-center justify-between">
//             <Button variant="ghost" size="icon" onClick={() => setCurrentDate(subWeeks(currentDate, 1))}>
//             <ChevronLeft className="h-5 w-5" />
//             </Button>
//             <div className="text-lg font-semibold text-center">
//             {format(weekStart, 'MMM d')} - {format(addDays(weekStart, 6), 'MMM d, yyyy')}
//             </div>
//             <Button variant="ghost" size="icon" onClick={() => setCurrentDate(addWeeks(currentDate, 1))}>
//             <ChevronRight className="h-5 w-5" />
//             </Button>
//         </div>
//         <div className="grid grid-cols-7 gap-2">
//             {daysOfWeek.map((day) => (
//             <div key={day.toISOString()} className="text-center">
//                 <div className="font-semibold">{format(day, 'E')}</div>
//                 <div className="text-sm text-muted-foreground">{format(day, 'd')}</div>
//                 <div className="mt-2 flex flex-col gap-1.5">
//                 {timeSlots.map((time) => {
//                     const slotDate = getUTCDateForSlot(day, time);
//                     const status = getSlotStatus(slotDate);
//                     let variant: "default" | "outline" | "destructive" = "outline";
//                     let className = "transition-colors duration-150";
//                     let disabled = false;

//                     switch (status) {
//                     case 'Selected': variant = 'default'; className += ' bg-blue-600 hover:bg-blue-700 text-white'; break;
//                     case 'Occupied': variant = 'destructive'; className += ' bg-red-200 text-red-800 cursor-not-allowed'; disabled = true; break;
//                     case 'Past': className += ' bg-muted text-muted-foreground cursor-not-allowed'; disabled = true; break;
//                     }

//                     return (
//                     <Button key={time} variant={variant} disabled={disabled} className={className} onClick={() => handleSlotClick(day, time)}>
//                         {time}
//                     </Button>
//                     );
//                 })}
//                 </div>
//             </div>
//             ))}
//         </div>
//         <div className="flex justify-end gap-2 pt-4">
//             <Button variant="ghost" onClick={onClose}>Cancel</Button>
//             <Button onClick={handleSaveClick}>Save Availability</Button>
//         </div>
//     </div>
//   );
// };



// import { useState, useMemo, useEffect } from 'react';
// import {
//   format,
//   startOfWeek,
//   addDays,
//   addWeeks,
//   subWeeks,
//   isBefore,
//   startOfToday,
//   isWithinInterval,
//   parseISO,
//   addHours,
//   isEqual,
// } from 'date-fns';
// import { Button } from '@/components/ui/button';
// import { ChevronLeft, ChevronRight } from 'lucide-react';

// // (All type definitions remain the same)
// interface SlotRange { start: string; end: string; }
// interface BackendFreeSlot extends SlotRange { date: string; }
// interface BackendOccupiedSlot extends SlotRange { id: string; title: string; type: string; }
// interface AvailabilityObject { free_slots: BackendFreeSlot[]; occupied_slots: BackendOccupiedSlot[]; }
// interface EnhancedAvailabilitySelectorProps {
//   initialData: AvailabilityObject[] | null;
//   onSave: (updatedData: AvailabilityObject[]) => void;
//   onClose: () => void;
// }
// type SlotStatus = 'Selected' | 'Occupied' | 'Available' | 'Past';

// export const EnhancedAvailabilitySelector = ({
//   initialData,
//   onSave,
//   onClose,
// }: EnhancedAvailabilitySelectorProps) => {

//   const parsedInitialData = useMemo(() => {
//     if (initialData && initialData.length > 0) {
//       return {
//         free_slots: initialData[0].free_slots || [],
//         occupied_slots: initialData[0].occupied_slots || []
//       };
//     }
//     return { free_slots: [], occupied_slots: [] };
//   }, [initialData]);

//   const initializeSelectedSlots = (slots: SlotRange[]): Set<string> => {
//     const initialSlots = new Set<string>();
//     slots.forEach(range => {
//       let current = parseISO(range.start);
//       const end = parseISO(range.end);
//       while (isBefore(current, end)) {
//         initialSlots.add(current.toISOString());
//         current = addHours(current, 1);
//       }
//     });
//     return initialSlots;
//   };

//   const [selectedSlots, setSelectedSlots] = useState<Set<string>>(new Set());
//   const [isDragging, setIsDragging] = useState(false);
//   const [dragStartSlot, setDragStartSlot] = useState<string | null>(null);

//   useEffect(() => {
//     const initialSlots = initializeSelectedSlots(parsedInitialData.free_slots);
//     setSelectedSlots(initialSlots);
//   }, [parsedInitialData]);

//   const [currentDate, setCurrentDate] = useState(new Date());
//   const today = useMemo(() => startOfToday(), []);
//   const weekStart = useMemo(() => startOfWeek(currentDate, { weekStartsOn: 1 }), [currentDate]);
//   const daysOfWeek = useMemo(() => Array.from({ length: 7 }).map((_, i) => addDays(weekStart, i)), [weekStart]);
//   const timeSlots = useMemo(() => Array.from({ length: 9 }).map((_, i) => `${9 + i}:00`), []);
  
//   const occupiedIntervals = useMemo(() => 
//     parsedInitialData.occupied_slots.map(slot => ({
//       start: parseISO(slot.start),
//       end: parseISO(slot.end)
//     })), [parsedInitialData.occupied_slots]
//   );
  
//   // =========================================================================
//   // --- THE DEFINITIVE FIX: Build a UTC Date from LOCAL Components ---
//   // This resolves the timezone conflict permanently.
//   // =========================================================================
//   const getUTCDateForSlot = (day: Date, time: string): Date => {
//       const [hour] = time.split(':').map(Number);
//       // We take the LOCAL year, month, and day that the user SEES on the calendar.
//       const localYear = day.getFullYear();
//       const localMonth = day.getMonth();
//       const localDay = day.getDate();
      
//       // Then, we use those LOCAL components to construct a PURE UTC timestamp.
//       const utcTimestamp = Date.UTC(localYear, localMonth, localDay, hour, 0, 0, 0);
//       return new Date(utcTimestamp);
//   };
  
//   const getSlotStatus = (slotDate: Date): SlotStatus => {
//     // This now compares a correct UTC date against the start of the user's LOCAL day.
//     if (isBefore(slotDate, today)) return 'Past';

//     const slotISO = slotDate.toISOString();
//     const isOccupied = occupiedIntervals.some(interval => isWithinInterval(slotDate, interval));
//     if (isOccupied) return 'Occupied';
//     if (selectedSlots.has(slotISO)) return 'Selected';
//     return 'Available';
//   };

//   const handleSlotClick = (day: Date, time: string) => {
//     const slotDate = getUTCDateForSlot(day, time);
//     const status = getSlotStatus(slotDate);
    
//     // Prevent interaction with past or occupied slots
//     if (status === 'Past' || status === 'Occupied') return;

//     const newSelectedSlots = new Set(selectedSlots);
//     const slotISO = slotDate.toISOString();
    
//     if (newSelectedSlots.has(slotISO)) {
//       newSelectedSlots.delete(slotISO);
//     } else {
//       newSelectedSlots.add(slotISO);
//     }
//     setSelectedSlots(newSelectedSlots);
//   };

//   // Add functionality to select/deselect all available slots
//   const handleSelectAll = () => {
//     const newSelectedSlots = new Set<string>();
//     daysOfWeek.forEach(day => {
//       timeSlots.forEach(time => {
//         const slotDate = getUTCDateForSlot(day, time);
//         const status = getSlotStatus(slotDate);
//         if (status === 'Available') {
//           newSelectedSlots.add(slotDate.toISOString());
//         }
//       });
//     });
//     setSelectedSlots(new Set([...selectedSlots, ...newSelectedSlots]));
//   };

//   const handleClearAll = () => {
//     setSelectedSlots(new Set());
//   };
  
//   const handleSaveClick = () => {
//     // Convert selected slots to sorted Date objects with proper typing
//     const sortedSlots = Array.from(selectedSlots)
//       .map((slotISO) => parseISO(slotISO as string))
//       .sort((a: Date, b: Date) => a.getTime() - b.getTime());
    
//     const mergedRanges: SlotRange[] = [];
//     if (sortedSlots.length > 0) {
//       let currentRange: { start: Date; end: Date } = { 
//         start: sortedSlots[0], 
//         end: addHours(sortedSlots[0], 1) 
//       };
      
//       for (let i = 1; i < sortedSlots.length; i++) {
//         if (isEqual(sortedSlots[i], currentRange.end)) {
//           currentRange.end = addHours(sortedSlots[i], 1);
//         } else {
//           mergedRanges.push({ 
//             start: currentRange.start.toISOString(), 
//             end: currentRange.end.toISOString() 
//           });
//           currentRange = { 
//             start: sortedSlots[i], 
//             end: addHours(sortedSlots[i], 1) 
//           };
//         }
//       }
//       mergedRanges.push({ 
//         start: currentRange.start.toISOString(), 
//         end: currentRange.end.toISOString() 
//       });
//     }

//     const formattedFreeSlots: BackendFreeSlot[] = mergedRanges.map(range => ({
//       ...range,
//       date: new Date(range.start).toISOString().split('T')[0]
//     }));

//     const payloadForBackend: AvailabilityObject[] = [{
//       free_slots: formattedFreeSlots,
//       occupied_slots: parsedInitialData.occupied_slots
//     }];
    
//     onSave(payloadForBackend);
//   };
  
//   return (
//     <div className="flex flex-col gap-6 p-6 bg-gradient-to-br from-slate-50 to-white min-h-full rounded-lg shadow-lg">
//       {/* Header with Navigation */}
//       <div className="flex items-center justify-between bg-white rounded-lg p-4 shadow-sm border">
//         <Button 
//           variant="ghost" 
//           size="icon" 
//           onClick={() => setCurrentDate(subWeeks(currentDate, 1))}
//           className="hover:bg-blue-50 hover:text-blue-600"
//         >
//           <ChevronLeft className="h-5 w-5" />
//         </Button>
//         <div className="text-xl font-bold text-gray-800">
//           {format(weekStart, 'MMM d')} - {format(addDays(weekStart, 6), 'MMM d, yyyy')}
//         </div>
//         <Button 
//           variant="ghost" 
//           size="icon" 
//           onClick={() => setCurrentDate(addWeeks(currentDate, 1))}
//           className="hover:bg-blue-50 hover:text-blue-600"
//         >
//           <ChevronRight className="h-5 w-5" />
//         </Button>
//       </div>

//       {/* Legend */}
//       <div className="flex flex-wrap justify-center gap-4 bg-white p-4 rounded-lg shadow-sm border">
//         <div className="flex items-center gap-2">
//           <div className="w-4 h-4 bg-green-500 rounded-full shadow-sm"></div>
//           <span className="text-sm font-medium text-gray-700">Available</span>
//         </div>
//         <div className="flex items-center gap-2">
//           <div className="w-4 h-4 bg-blue-600 rounded-full shadow-sm"></div>
//           <span className="text-sm font-medium text-gray-700">Selected</span>
//         </div>
//         <div className="flex items-center gap-2">
//           <div className="w-4 h-4 bg-red-500 rounded-full shadow-sm"></div>
//           <span className="text-sm font-medium text-gray-700">Booked</span>
//         </div>
//         <div className="flex items-center gap-2">
//           <div className="w-4 h-4 bg-gray-300 rounded-full shadow-sm"></div>
//           <span className="text-sm font-medium text-gray-700">Past</span>
//         </div>
//       </div>

//       {/* Calendar Grid */}
//       <div className="grid grid-cols-7 gap-3 bg-white p-4 rounded-lg shadow-sm border">
//         {daysOfWeek.map((day) => {
//           const isToday = format(day, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd');
//           return (
//             <div key={day.toISOString()} className="text-center">
//               {/* Day Header */}
//               <div className={`font-bold text-base mb-1 ${isToday ? 'text-blue-600' : 'text-gray-800'}`}>
//                 {format(day, 'E')}
//               </div>
//               <div className={`text-sm mb-3 ${isToday ? 'text-blue-600 font-semibold' : 'text-gray-600'}`}>
//                 {format(day, 'd')}
//               </div>
              
//               {/* Time Slots */}
//               <div className="flex flex-col gap-2">
//                 {timeSlots.map((time) => {
//                   const slotDate = getUTCDateForSlot(day, time);
//                   const status = getSlotStatus(slotDate);
//                   let className = "text-xs font-medium py-2 px-3 rounded-lg transition-all duration-200 transform hover:scale-105 shadow-sm min-h-[36px] flex items-center justify-center";
//                   let disabled = false;
//                   let slotContent = time;

//                   switch (status) {
//                     case 'Selected': 
//                       className += ' bg-blue-600 hover:bg-blue-700 text-white shadow-md ring-2 ring-blue-200';
//                       break;
//                     case 'Occupied': 
//                       className += ' bg-red-500 text-white cursor-not-allowed opacity-90 shadow-md';
//                       disabled = true;
//                       slotContent = '🔒';
//                       break;
//                     case 'Available': 
//                       className += ' bg-green-50 hover:bg-green-100 text-green-700 border-2 border-green-200 hover:border-green-300';
//                       break;
//                     case 'Past': 
//                       className += ' bg-gray-100 text-gray-400 cursor-not-allowed opacity-60';
//                       disabled = true;
//                       break;
//                   }

//                   // Add pulse animation for available slots
//                   if (status === 'Available') {
//                     className += ' hover:shadow-lg';
//                   }

//                   return (
//                     <button
//                       key={time}
//                       disabled={disabled}
//                       className={className}
//                       onClick={() => handleSlotClick(day, time)}
//                       title={`${time} - ${status}`}
//                     >
//                       <div className="flex flex-col items-center">
//                         <span className="text-xs font-semibold">{slotContent}</span>
//                         {status === 'Occupied' && (
//                           <span className="text-[10px] opacity-80">Booked</span>
//                         )}
//                       </div>
//                     </button>
//                   );
//                 })}
//               </div>
//             </div>
//           );
//         })}
//       </div>

//       {/* Action Buttons */}
//       <div className="flex justify-between items-center bg-white p-4 rounded-lg shadow-sm border">
//         <div className="flex items-center gap-4">
//           <div className="text-sm text-gray-600">
//             Selected: <span className="font-semibold text-blue-600">{selectedSlots.size}</span> slots
//           </div>
//           <div className="flex gap-2">
//             <Button 
//               variant="outline" 
//               size="sm"
//               onClick={handleSelectAll}
//               className="text-xs hover:bg-green-50 hover:text-green-700 hover:border-green-300"
//             >
//               Select All Available
//             </Button>
//             <Button 
//               variant="outline" 
//               size="sm"
//               onClick={handleClearAll}
//               className="text-xs hover:bg-red-50 hover:text-red-700 hover:border-red-300"
//               disabled={selectedSlots.size === 0}
//             >
//               Clear All
//             </Button>
//           </div>
//         </div>
//         <div className="flex gap-3">
//           <Button 
//             variant="outline" 
//             onClick={onClose}
//             className="hover:bg-gray-50"
//           >
//             Cancel
//           </Button>
//           <Button 
//             onClick={handleSaveClick}
//             className="bg-blue-600 hover:bg-blue-700 text-white shadow-md"
//             disabled={selectedSlots.size === 0}
//           >
//             Save Availability ({selectedSlots.size})
//           </Button>
//         </div>
//       </div>
//     </div>
//   );
// };


// import { useState, useMemo, useEffect } from 'react';
// import {
//   format,
//   startOfWeek,
//   addDays,
//   addWeeks,
//   subWeeks,
//   isBefore,
//   startOfToday,
//   isWithinInterval,
//   parseISO,
//   addHours,
//   isEqual,
// } from 'date-fns';
// import { Button } from '@/components/ui/button';
// import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'; // Import Tooltip
// import { ChevronLeft, ChevronRight, Lock } from 'lucide-react';

// // (All type definitions remain the same)
// interface SlotRange { start: string; end: string; }
// interface BackendFreeSlot extends SlotRange { date: string; }
// interface BackendOccupiedSlot extends SlotRange { id: string; title:string; type: string; }
// interface AvailabilityObject { free_slots: BackendFreeSlot[]; occupied_slots: BackendOccupiedSlot[]; }
// interface EnhancedAvailabilitySelectorProps {
//   initialData: AvailabilityObject[] | null;
//   onSave: (updatedData: AvailabilityObject[]) => void;
//   onClose: () => void;
// }
// type SlotStatus = 'Selected' | 'Occupied' | 'Available' | 'Past';

// export const EnhancedAvailabilitySelector = ({
//   initialData,
//   onSave,
//   onClose,
// }: EnhancedAvailabilitySelectorProps) => {

//   const parsedInitialData = useMemo(() => {
//     if (initialData && initialData.length > 0) {
//       return {
//         free_slots: initialData[0].free_slots || [],
//         occupied_slots: initialData[0].occupied_slots || []
//       };
//     }
//     return { free_slots: [], occupied_slots: [] };
//   }, [initialData]);

//   const initializeSelectedSlots = (slots: SlotRange[]): Set<string> => {
//     const initialSlots = new Set<string>();
//     slots.forEach(range => {
//       let current = parseISO(range.start);
//       const end = parseISO(range.end);
//       while (isBefore(current, end)) {
//         initialSlots.add(current.toISOString());
//         current = addHours(current, 1);
//       }
//     });
//     return initialSlots;
//   };

//   const [selectedSlots, setSelectedSlots] = useState<Set<string>>(new Set());
  
//   // --- SMART FEATURE 1: State for Drag-to-Select ---
//   const [isDragging, setIsDragging] = useState(false);
//   const [dragSelectionMode, setDragSelectionMode] = useState<'select' | 'deselect' | null>(null);


//   useEffect(() => {
//     const initialSlots = initializeSelectedSlots(parsedInitialData.free_slots);
//     setSelectedSlots(initialSlots);
//   }, [parsedInitialData]);

//   const [currentDate, setCurrentDate] = useState(new Date());
//   const today = useMemo(() => startOfToday(), []);
//   const weekStart = useMemo(() => startOfWeek(currentDate, { weekStartsOn: 1 }), [currentDate]);
//   const daysOfWeek = useMemo(() => Array.from({ length: 7 }).map((_, i) => addDays(weekStart, i)), [weekStart]);
//   const timeSlots = useMemo(() => Array.from({ length: 12 }).map((_, i) => `${8 + i}:00`), []); // Expanded to 8 AM - 7 PM
  
//   const occupiedDataMap = useMemo(() => {
//     const map = new Map<string, BackendOccupiedSlot>();
//     parsedInitialData.occupied_slots.forEach(slot => {
//         let current = parseISO(slot.start);
//         const end = parseISO(slot.end);
//         while(isBefore(current, end)) {
//             map.set(current.toISOString(), slot);
//             current = addHours(current, 1);
//         }
//     });
//     return map;
//   }, [parsedInitialData.occupied_slots]);

//   const getUTCDateForSlot = (day: Date, time: string): Date => {
//       const [hour] = time.split(':').map(Number);
//       const localYear = day.getFullYear();
//       const localMonth = day.getMonth();
//       const localDay = day.getDate();
//       const utcTimestamp = Date.UTC(localYear, localMonth, localDay, hour, 0, 0, 0);
//       return new Date(utcTimestamp);
//   };
  
//   const getSlotStatus = (slotDate: Date): SlotStatus => {
//     if (isBefore(slotDate, today)) return 'Past';
//     const slotISO = slotDate.toISOString();
//     if (occupiedDataMap.has(slotISO)) return 'Occupied';
//     if (selectedSlots.has(slotISO)) return 'Selected';
//     return 'Available';
//   };

//   // --- SMART FEATURE 1: Drag-to-Select Handlers ---
//   const handleMouseDown = (day: Date, time: string) => {
//     setIsDragging(true);
//     const slotDate = getUTCDateForSlot(day, time);
//     const status = getSlotStatus(slotDate);
//     if (status === 'Past' || status === 'Occupied') return;
    
//     const newSelectedSlots = new Set(selectedSlots);
//     const slotISO = slotDate.toISOString();

//     // Determine if we are selecting or deselecting
//     if (newSelectedSlots.has(slotISO)) {
//       newSelectedSlots.delete(slotISO);
//       setDragSelectionMode('deselect');
//     } else {
//       newSelectedSlots.add(slotISO);
//       setDragSelectionMode('select');
//     }
//     setSelectedSlots(newSelectedSlots);
//   };

//   const handleMouseEnter = (day: Date, time: string) => {
//     if (!isDragging) return;

//     const slotDate = getUTCDateForSlot(day, time);
//     const status = getSlotStatus(slotDate);
//     if (status === 'Past' || status === 'Occupied') return;

//     const newSelectedSlots = new Set(selectedSlots);
//     const slotISO = slotDate.toISOString();

//     if (dragSelectionMode === 'select') {
//       newSelectedSlots.add(slotISO);
//     } else if (dragSelectionMode === 'deselect') {
//       newSelectedSlots.delete(slotISO);
//     }
//     setSelectedSlots(newSelectedSlots);
//   };

//   const handleMouseUp = () => {
//     setIsDragging(false);
//     setDragSelectionMode(null);
//   };
  
//   const handleSelectAll = () => {
//     const newSlots = new Set(selectedSlots);
//     daysOfWeek.forEach(day => {
//       timeSlots.forEach(time => {
//         const slotDate = getUTCDateForSlot(day, time);
//         if (getSlotStatus(slotDate) === 'Available') {
//           newSlots.add(slotDate.toISOString());
//         }
//       });
//     });
//     setSelectedSlots(newSlots);
//   };

//   const handleClearAll = () => setSelectedSlots(new Set());
  
//   const handleSaveClick = () => {
//     const sortedSlots = Array.from(selectedSlots).map(parseISO).sort((a, b) => a.getTime() - b.getTime());
//     const mergedRanges: SlotRange[] = [];
//     if (sortedSlots.length > 0) {
//       let currentRange = { start: sortedSlots[0], end: addHours(sortedSlots[0], 1) };
//       for (let i = 1; i < sortedSlots.length; i++) {
//         if (isEqual(sortedSlots[i], currentRange.end)) {
//           currentRange.end = addHours(sortedSlots[i], 1);
//         } else {
//           mergedRanges.push({ start: currentRange.start.toISOString(), end: currentRange.end.toISOString() });
//           currentRange = { start: sortedSlots[i], end: addHours(sortedSlots[i], 1) };
//         }
//       }
//       mergedRanges.push({ start: currentRange.start.toISOString(), end: currentRange.end.toISOString() });
//     }
//     const formattedFreeSlots = mergedRanges.map(range => ({ ...range, date: new Date(range.start).toISOString().split('T')[0] }));
//     const payloadForBackend: AvailabilityObject[] = [{ free_slots: formattedFreeSlots, occupied_slots: parsedInitialData.occupied_slots }];
//     onSave(payloadForBackend);
//   };
  
//   return (
//     <TooltipProvider>
//         <div 
//           className="flex flex-col gap-4 p-4 bg-slate-50 min-h-full rounded-lg"
//           onMouseUp={handleMouseUp} // Stop dragging when mouse is released anywhere in the component
//           onMouseLeave={handleMouseUp} // Also stop if mouse leaves the component area
//         >
//         <div className="flex items-center justify-between">
//             <Button variant="ghost" size="icon" onClick={() => setCurrentDate(subWeeks(currentDate, 1))}>
//             <ChevronLeft className="h-5 w-5" />
//             </Button>
//             <div className="text-xl font-bold text-gray-700">
//             {format(weekStart, 'MMM d')} - {format(addDays(weekStart, 6), 'MMM d, yyyy')}
//             </div>
//             <Button variant="ghost" size="icon" onClick={() => setCurrentDate(addWeeks(currentDate, 1))}>
//             <ChevronRight className="h-5 w-5" />
//             </Button>
//         </div>

//         <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 p-2 rounded-lg border bg-white">
//             <div className="flex items-center gap-2"><div className="w-3.5 h-3.5 bg-white border-2 border-slate-300 rounded-sm"></div><span className="text-xs text-slate-600">Available</span></div>
//             <div className="flex items-center gap-2"><div className="w-3.5 h-3.5 bg-blue-600 rounded-sm"></div><span className="text-xs text-slate-600">Selected</span></div>
//             <div className="flex items-center gap-2"><div className="w-3.5 h-3.5 bg-red-500 rounded-sm"></div><span className="text-xs text-slate-600">Booked</span></div>
//             <div className="flex items-center gap-2"><div className="w-3.5 h-3.5 bg-slate-200 rounded-sm"></div><span className="text-xs text-slate-600">Past</span></div>
//         </div>

//         <div className="grid grid-cols-7 gap-2">
//             {daysOfWeek.map((day) => {
//             const isToday = format(day, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd');
//             return (
//                 <div key={day.toISOString()} className="text-center bg-white p-2 rounded-lg border">
//                 <div className={`font-bold text-sm mb-1 ${isToday ? 'text-blue-600' : 'text-gray-600'}`}>{format(day, 'E')}</div>
//                 <div className={`text-xl mb-2 ${isToday ? 'text-blue-600 font-extrabold' : 'text-gray-800'}`}>{format(day, 'd')}</div>
//                 <div className="flex flex-col gap-1.5">
//                     {timeSlots.map((time) => {
//                     const slotDate = getUTCDateForSlot(day, time);
//                     const status = getSlotStatus(slotDate);
//                     const occupiedInfo = occupiedDataMap.get(slotDate.toISOString());

//                     let className = "text-xs font-semibold py-2 px-1 rounded-md transition-all duration-150 w-full min-h-[36px] border";
//                     let disabled = false;

//                     switch (status) {
//                         case 'Selected': className += ' bg-blue-600 border-blue-700 text-white'; break;
//                         case 'Occupied': className += ' bg-red-500 border-red-600 text-white cursor-not-allowed'; disabled = true; break;
//                         case 'Available': className += ' bg-white border-slate-300 text-slate-700 hover:bg-blue-50 hover:border-blue-400'; break;
//                         case 'Past': className += ' bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed'; disabled = true; break;
//                     }

//                     const button = (
//                         <button
//                             key={time}
//                             disabled={disabled}
//                             className={className}
//                             onMouseDown={() => handleMouseDown(day, time)}
//                             onMouseEnter={() => handleMouseEnter(day, time)}
//                             // onClick is not needed as mouseDown handles it
//                         >
//                             {status === 'Occupied' ? <Lock className="w-3 h-3"/> : time}
//                         </button>
//                     );
                    
//                     // --- SMART FEATURE 2: Add a tooltip ONLY for occupied slots ---
//                     return status === 'Occupied' ? (
//                         <Tooltip>
//                             <TooltipTrigger asChild>{button}</TooltipTrigger>
//                             <TooltipContent><p>{occupiedInfo?.title || 'Booked'}</p></TooltipContent>
//                         </Tooltip>
//                     ) : (
//                         button
//                     );
//                     })}
//                 </div>
//                 </div>
//             );
//             })}
//         </div>

//         <div className="flex justify-between items-center mt-2">
//             <div className="flex gap-2">
//                 <Button variant="outline" size="sm" onClick={handleSelectAll}>Select All</Button>
//                 <Button variant="outline" size="sm" onClick={handleClearAll} disabled={selectedSlots.size === 0}>Clear All</Button>
//             </div>
//             <div className="flex gap-3">
//                 <Button variant="ghost" onClick={onClose}>Cancel</Button>
//                 <Button onClick={handleSaveClick} className="bg-blue-600 hover:bg-blue-700 text-white font-bold">
//                     Save Availability
//                 </Button>
//             </div>
//         </div>
//         </div>
//     </TooltipProvider>
//   );
// };


import { useState, useMemo, useEffect } from 'react';
import {
  format,
  startOfWeek,
  addDays,
  addWeeks,
  subWeeks,
  parseISO,
  addHours,
  isEqual,
} from 'date-fns';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ChevronLeft, ChevronRight, Lock } from 'lucide-react';

// --- Type Definitions (Unchanged) ---
interface SlotRange { start: string; end: string; }
interface BackendFreeSlot extends SlotRange { date: string; }
interface BackendOccupiedSlot extends SlotRange { id: string; title: string; type: string; }
interface AvailabilityObject { free_slots: BackendFreeSlot[]; occupied_slots: BackendOccupiedSlot[]; }
interface EnhancedAvailabilitySelectorProps {
  initialData: AvailabilityObject[] | null;
  onSave: (updatedData: AvailabilityObject[]) => void;
  onClose: () => void;
}
type SlotStatus = 'Selected' | 'Occupied' | 'Available' | 'Past';

export const EnhancedAvailabilitySelector = ({
  initialData,
  onSave,
  onClose,
}: EnhancedAvailabilitySelectorProps) => {

  // --- STATE MANAGEMENT: The Single Source of Truth ---
  const [selectedSlots, setSelectedSlots] = useState<Set<string>>(new Set());

  // Other UI-related state
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isDragging, setIsDragging] = useState(false);
  const [dragSelectionMode, setDragSelectionMode] = useState<'select' | 'deselect' | null>(null);

  // --- PARSED DATA FROM PROPS ---
  const parsedInitialData = useMemo(() => {
    if (initialData && initialData.length > 0) {
      return initialData[0];
    }
    return { free_slots: [], occupied_slots: [] };
  }, [initialData]);
  
  const occupiedDataMap = useMemo(() => {
    const map = new Map<string, BackendOccupiedSlot>();
    (parsedInitialData.occupied_slots || []).forEach(slot => {
        let current = parseISO(slot.start);
        const end = parseISO(slot.end);
        while(current.getTime() < end.getTime()) {
            map.set(current.toISOString(), slot);
            current = addHours(current, 1);
        }
    });
    return map;
  }, [parsedInitialData.occupied_slots]);


  // =========================================================================
  // --- THE DEFINITIVE FIX: Syncing Props to State Reliably ---
  // This hook listens for when `initialData` arrives from the backend.
  // When it does, it populates our `selectedSlots` state ONCE.
  // This is the standard, bulletproof React pattern for this problem.
  // =========================================================================
  useEffect(() => {
    console.log("SYNC EFFECT: Data received from props. Processing free_slots:", parsedInitialData.free_slots);
    
    const initialSlots = new Set<string>();
    (parsedInitialData.free_slots || []).forEach(range => {
      let current = parseISO(range.start);
      const end = parseISO(range.end);
      while (current.getTime() < end.getTime()) {
        initialSlots.add(current.toISOString());
        current = addHours(current, 1);
      }
    });
    
    console.log(`SYNC EFFECT: Populating state with ${initialSlots.size} slots.`);
    // Set our component's internal state to match the data from the database.
    setSelectedSlots(initialSlots);

  }, [initialData]); // Dependency array ensures this runs ONLY when the `initialData` prop changes.


  // --- All rendering logic below is now simple and reliable ---

  const startOfUTCToday = useMemo(() => {
    const now = new Date();
    return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  }, []);

  const getUTCDateForSlot = (day: Date, time: string): Date => {
      const [hour] = time.split(':').map(Number);
      return new Date(Date.UTC(day.getFullYear(), day.getMonth(), day.getDate(), hour));
  };
  
  // This function is now simple because it only needs to check our reliable `selectedSlots` state.
  const getSlotStatus = (slotDate: Date): SlotStatus => {
    if (slotDate.getTime() < startOfUTCToday.getTime()) return 'Past';
    const slotISO = slotDate.toISOString();
    if (occupiedDataMap.has(slotISO)) return 'Occupied';
    if (selectedSlots.has(slotISO)) return 'Selected'; // Direct check against the component's state
    return 'Available';
  };

  const handleMouseDown = (day: Date, time: string) => {
    const slotDate = getUTCDateForSlot(day, time);
    const status = getSlotStatus(slotDate);
    if (status === 'Past' || status === 'Occupied') return;

    setIsDragging(true);
    const slotISO = slotDate.toISOString();
    
    setSelectedSlots(prevSlots => {
      const newSlots = new Set(prevSlots);
      const mode = newSlots.has(slotISO) ? 'deselect' : 'select';
      setDragSelectionMode(mode);
      if (mode === 'deselect') newSlots.delete(slotISO);
      else newSlots.add(slotISO);
      return newSlots;
    });
  };

  const handleMouseEnter = (day: Date, time: string) => {
    if (!isDragging) return;
    const slotDate = getUTCDateForSlot(day, time);
    if (getSlotStatus(slotDate) === 'Past' || getSlotStatus(slotDate) === 'Occupied') return;

    const slotISO = slotDate.toISOString();
    setSelectedSlots(prevSlots => {
        const newSlots = new Set(prevSlots);
        if (dragSelectionMode === 'select') newSlots.add(slotISO);
        else if (dragSelectionMode === 'deselect') newSlots.delete(slotISO);
        return newSlots;
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setDragSelectionMode(null);
  };
  
  const handleClearAll = () => setSelectedSlots(new Set());
  
  const handleSaveClick = () => {
    const sortedSlots = Array.from(selectedSlots).map(parseISO).sort((a, b) => a.getTime() - b.getTime());
    const mergedRanges: SlotRange[] = [];
    if (sortedSlots.length > 0) {
      let currentRange = { start: sortedSlots[0], end: addHours(sortedSlots[0], 1) };
      for (let i = 1; i < sortedSlots.length; i++) {
        if (isEqual(sortedSlots[i], currentRange.end)) {
          currentRange.end = addHours(sortedSlots[i], 1);
        } else {
          mergedRanges.push({ start: currentRange.start.toISOString(), end: currentRange.end.toISOString() });
          currentRange = { start: sortedSlots[i], end: addHours(sortedSlots[i], 1) };
        }
      }
      mergedRanges.push({ start: currentRange.start.toISOString(), end: currentRange.end.toISOString() });
    }
    const formattedFreeSlots = mergedRanges.map(range => ({ ...range, date: new Date(range.start).toISOString().split('T')[0] }));
    const payloadForBackend: AvailabilityObject[] = [{ free_slots: formattedFreeSlots, occupied_slots: parsedInitialData.occupied_slots }];
    onSave(payloadForBackend);
  };
  
  const weekStart = useMemo(() => startOfWeek(currentDate, { weekStartsOn: 1 }), [currentDate]);
  const daysOfWeek = useMemo(() => Array.from({ length: 7 }).map((_, i) => addDays(weekStart, i)), [weekStart]);
  const timeSlots = useMemo(() => Array.from({ length: 12 }).map((_, i) => `${8 + i}:00`), []);

  return (
    <TooltipProvider>
      <div 
        className="flex flex-col gap-4 p-4 bg-slate-50 min-h-full rounded-lg"
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="icon" onClick={() => setCurrentDate(subWeeks(currentDate, 1))}><ChevronLeft className="h-5 w-5" /></Button>
          <div className="text-xl font-bold text-gray-700">{format(weekStart, 'MMM d')} - {format(addDays(weekStart, 6), 'MMM d, yyyy')}</div>
          <Button variant="ghost" size="icon" onClick={() => setCurrentDate(addWeeks(currentDate, 1))}><ChevronRight className="h-5 w-5" /></Button>
        </div>

        <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 p-2 rounded-lg border bg-white">
          <div className="flex items-center gap-2"><div className="w-3.5 h-3.5 bg-white border-2 border-slate-300 rounded-sm"></div><span className="text-xs text-slate-600">Available</span></div>
          <div className="flex items-center gap-2"><div className="w-3.5 h-3.5 bg-blue-600 rounded-sm"></div><span className="text-xs text-slate-600">Selected</span></div>
          <div className="flex items-center gap-2"><div className="w-3.5 h-3.5 bg-red-500 rounded-sm"></div><span className="text-xs text-slate-600">Booked</span></div>
          <div className="flex items-center gap-2"><div className="w-3.5 h-3.5 bg-slate-200 rounded-sm"></div><span className="text-xs text-slate-600">Past</span></div>
        </div>

        <div className="grid grid-cols-7 gap-2">
          {daysOfWeek.map((day) => {
          const isToday = format(new Date(), 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd');
          return (
              <div key={day.toISOString()} className="text-center bg-white p-2 rounded-lg border">
              <div className={`font-bold text-sm mb-1 ${isToday ? 'text-blue-600' : 'text-gray-600'}`}>{format(day, 'E')}</div>
              <div className={`text-xl mb-2 ${isToday ? 'text-blue-600 font-extrabold' : 'text-gray-800'}`}>{format(day, 'd')}</div>
              <div className="flex flex-col gap-1.5">
                  {timeSlots.map((time) => {
                  const slotDate = getUTCDateForSlot(day, time);
                  const status = getSlotStatus(slotDate);
                  const occupiedInfo = occupiedDataMap.get(slotDate.toISOString());
                  let className = "text-xs font-semibold py-2 px-1 rounded-md transition-all duration-150 w-full min-h-[36px] border";
                  let disabled = false;
                  switch (status) {
                      case 'Selected': className += ' bg-blue-600 border-blue-700 text-white'; break;
                      case 'Occupied': className += ' bg-red-500 border-red-600 text-white cursor-not-allowed'; disabled = true; break;
                      case 'Available': className += ' bg-white border-slate-300 text-slate-700 hover:bg-blue-50 hover:border-blue-400'; break;
                      case 'Past': className += ' bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed'; disabled = true; break;
                  }
                  const button = (<button key={time} disabled={disabled} className={className} onMouseDown={() => handleMouseDown(day, time)} onMouseEnter={() => handleMouseEnter(day, time)}>{status === 'Occupied' ? <Lock className="w-3 h-3 mx-auto"/> : time}</button>);
                  return status === 'Occupied' ? (<Tooltip><TooltipTrigger asChild>{button}</TooltipTrigger><TooltipContent><p>{occupiedInfo?.title || 'Booked'}</p></TooltipContent></Tooltip>) : (button);
                  })}
              </div>
              </div>
          );
          })}
        </div>

        <div className="flex justify-between items-center mt-2">
            <div className="flex gap-2"><Button variant="outline" size="sm" onClick={handleClearAll} disabled={selectedSlots.size === 0}>Clear All</Button></div>
            <div className="flex gap-3"><Button variant="ghost" onClick={onClose}>Cancel</Button><Button onClick={handleSaveClick} className="bg-blue-600 hover:bg-blue-700 text-white font-bold">Save Availability</Button></div>
        </div>
      </div>
    </TooltipProvider>
  );
};