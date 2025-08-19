// import { useState, useEffect, useCallback } from 'react';
// import { supabase } from '@/integrations/supabase/client';
// import { useToast } from '@/hooks/use-toast';
// import { DataType } from '../types';
// import { getSearchFields, applyStatusFilter } from '../utils';

// export const useDetailedViewData = (
//   type: DataType, 
//   open: boolean, 
//   initialData?: any[],
//   defaultFilter?: string
// ) => {
//   const [data, setData] = useState<any[]>([]);
//   const [filteredData, setFilteredData] = useState<any[]>([]);
//   const [loading, setLoading] = useState(false);
//   const [searchTerm, setSearchTerm] = useState('');
//   const [filterValue, setFilterValue] = useState('all');

//   // Reset filter value when modal opens or defaultFilter changes
//   useEffect(() => {
//     if (open) {
//       // Always reset to the provided default when modal opens
//       setFilterValue(defaultFilter || 'all');
//       setSearchTerm(''); // Also reset search term for clean state
//     }
//   }, [open, defaultFilter]);
//   const { toast } = useToast();

//   const buildQuery = useCallback(() => {
//     switch (type) {
//       case 'users':
//         return supabase
//           .from('profiles')
//           .select('*, created_at')
//           .order('created_at', { ascending: false });
          
//       case 'companies':
//         return supabase
//           .from('companies')
//           .select('*')
//           .order('created_at', { ascending: false });
          
//       case 'vendors':
//         return supabase
//           .from('vendors')
//           .select(`
//             *,
//             companies (name)
//           `)
//           .order('created_at', { ascending: false });
          
//       case 'jobs':
//         return supabase
//           .from('jobs')
//           .select(`
//             *,
//             companies (name),
//             profiles!jobs_created_by_fkey (first_name, last_name),
//             job_applications (id, status)
//           `)
//           .order('created_at', { ascending: false });
          
//       case 'activeJobs':
//         return supabase
//           .from('jobs')
//           .select(`
//             *,
//             companies (name),
//             profiles!jobs_created_by_fkey (first_name, last_name),
//             job_applications (id, status)
//           `)
//           // .eq('status', 'published')
//           .order('created_at', { ascending: false });
          
//       case 'applications':
//         return supabase
//           .from('job_applications')
//           .select(`
//       id,
//       status,
//       screening_score,
//       ai_screening_notes,
//       applied_at,
//       jobs!inner(title, companies!inner(name)),
//       candidates!inner(
//         profiles!inner(
//           first_name,
//           last_name,
//           email
//         )
//       )
//     `)
//     .order('applied_at', { ascending: false });
//           // .select(`
//           //   *,
//           //   jobs (title, companies (name)),
//           //   candidates (first_name, last_name, email)
//           // `)
//           // .order('applied_at', { ascending: false });
          
//       case 'monthlyHires':
//         const monthAgo = new Date();
//         monthAgo.setMonth(monthAgo.getMonth() - 1);
        
//         return supabase
//           .from('job_applications')
//           .select(`
//             *,
//             jobs (title, companies (name)),
//             candidates (first_name, last_name, email)
//           `)
//           .eq('status', 'hired')
//           .gte('updated_at', monthAgo.toISOString())
//           .order('updated_at', { ascending: false });

//        case 'my-applications':
//         return supabase
//           .from('job_applications')
//           .select('id, applied_at, status, jobs!inner(title, companies(name))')
//           .order('applied_at', { ascending: false });

//       case 'in-review':
//         return supabase
//           .from('job_applications')
//           .select('id, applied_at, status, jobs!inner(title, companies(name))')
//           .in('status', ['screening', 'interviewing', 'testing']) // Your "in review" statuses
//           .order('applied_at', { ascending: false });

//       case 'my-interviews':
//          const candidateId = arguments[0]; // Access the passed-in ID
//         if (!candidateId) return null; // Safety check: do not run if no ID is provided
//         return supabase
//           .from('interview_schedules')
//           .select('id, scheduled_at, status, interview_type, job_applications!inner(candidate_id, jobs!inner(title, companies(name)))')
//           .eq('job_applications.candidate_id', candidateId) // The crucial filter
//           .order('scheduled_at', { ascending: true }); // return supabase
//         //   .from('interview_schedules')
//         //   .select('id, scheduled_at, status, interview_type, job_applications!inner(jobs!inner(title, companies(name)))')
//         //   .order('scheduled_at', { ascending: true });

//        case 'scheduledInterviews':
//         return supabase
//           .from('interview_schedules')
//           .select(`
//             id,
//             scheduled_at,
//             status,
//             interview_type,
//             job_applications!inner (
//               jobs!inner (
//                 title,
//                 companies!inner (name)
//               ),
//               candidates!inner (
//                 profiles!inner (
//                   first_name,
//                   last_name,
//                   email
//                 )
//               )
//             )
//           `)
//           .order('scheduled_at', { ascending: false });
              
//       default:
//         return null;
//     }
//   }, [type]);

//   const fetchData = useCallback(async () => {
//      if (initialData) return;
//     setLoading(true);
//     try {
//       const query = buildQuery();
//       if (!query){
//         setData([]);
//         return;
//       };

//       const { data: result, error } = await query;
      
//       if (error) throw error;
//       setData(result || []);
//     } catch (error: any) {
//       toast({
//         title: "Error",
//         description: error.message,
//         variant: "destructive"
//       });
//     } finally {
//       setLoading(false);
//     }
//   }, [buildQuery, toast, initialData]);

//   const filterData = useCallback(() => {
//     let filtered = data;

//     // Apply search filter
//     if (searchTerm) {
//       filtered = filtered.filter((item) => {
//         const searchFields = getSearchFields(item, type);
//         return searchFields.some(field => 
//           field?.toString().toLowerCase().includes(searchTerm.toLowerCase())
//         );
//       });
//     }

//     // Apply dropdown filter
//     filtered = filtered.filter((item) => applyStatusFilter(item, type, filterValue));

//     setFilteredData(filtered);
//   }, [data, searchTerm, filterValue, type]);

//   useEffect(() => {
//      if (initialData) {
//         console.log("Modal is using pre-fetched initialData:", initialData);
//         setData(initialData);
//         setLoading(false); // Make sure to turn off loading
//       } else {
//         // Otherwise, if no data was passed, perform a fetch as normal.
//         console.log("Modal has no initialData, fetching from database...");
//         fetchData();
//       }
//   }, [open, fetchData]);

//   useEffect(() => {
//     filterData();
//   }, [filterData]);

//   return {
//     data,
//     filteredData,
//     loading,
//     searchTerm,
//     filterValue,
//     setSearchTerm,
//     setFilterValue,
//     refetchData: fetchData
//   };
// };










import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { DataType } from '../types';
import { getSearchFields, applyStatusFilter } from '../utils';
import { useAuth } from '@/hooks/useAuth';

export const useDetailedViewData = (
  type: DataType,
  open: boolean,
  initialData?: any[],
  defaultFilter?: string
) => {
  const { profile } = useAuth(); // We still need this to know a user is logged in
  const [data, setData] = useState<any[]>([]);
  const [filteredData, setFilteredData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterValue, setFilterValue] = useState('all');
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      setFilterValue(defaultFilter || 'all');
      setSearchTerm('');
    }
  }, [open, defaultFilter]);

  // buildQuery remains for your other working modals (Admin, etc.)
  const buildQuery = useCallback(() => {
    switch (type) {
        case 'users':
            return supabase.from('profiles').select('*, created_at').order('created_at', { ascending: false });
        case 'applications':
            return supabase.from('job_applications').select(`id, status, screening_score, applied_at, jobs!inner(title, companies!inner(name)), candidates!inner(profiles!inner(first_name, last_name, email))`).order('applied_at', { ascending: false });
        case 'scheduledInterviews':
             return supabase.from('interview_schedules').select(`id, scheduled_at, status, interview_type, job_applications!inner (jobs!inner (title, companies!inner (name)), candidates!inner (profiles!inner (first_name, last_name, email)))`).order('scheduled_at', { ascending: false });
      default:
        return null;
    }
  }, [type]);

  const fetchData = useCallback(async () => {
    if (!open || !profile?.id) return;
    if (initialData) {
      setData(initialData);
      return;
    }

    setLoading(true);
    try {
      let resultData: any[] = [];

      if (type === 'my-interviews') {
        // --- THIS IS THE NEW, SIMPLE LOGIC ---
        // Call the database function directly. No complex joins, no RLS issues.
        const { data, error } = await supabase.rpc('get_my_scheduled_interviews');
        if (error) throw error;
        resultData = data;
        
      } else {
        // Fallback for all other modals, leaving them untouched.
        const query = buildQuery();
        if (query) {
            const { data, error } = await query;
            if (error) throw error;
            resultData = data || [];
        }
      }
      
      setData(resultData);

    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [open, profile, type, initialData, buildQuery, toast]);

  const filterData = useCallback(() => {
    // ... no changes needed in this function ...
    const sourceData = data || [];
    let filtered = sourceData;
    if (searchTerm) {
      filtered = filtered.filter((item) => {
        const searchFields = getSearchFields(item, type);
        return searchFields.some(field => field?.toString().toLowerCase().includes(searchTerm.toLowerCase()));
      });
    }
    filtered = filtered.filter((item) => applyStatusFilter(item, type, filterValue));
    setFilteredData(filtered);
  }, [data, searchTerm, filterValue, type]);

  useEffect(() => {
    if (open) fetchData();
  }, [open, fetchData]);

  useEffect(() => {
    filterData();
  }, [data, searchTerm, filterValue, type]);

  return {
    data,
    filteredData,
    loading,
    searchTerm,
    filterValue,
    setSearchTerm,
    setFilterValue,
    refetchData: fetchData
  };
};





// import { useState, useEffect, useCallback } from 'react';
// import { supabase } from '@/integrations/supabase/client';
// import { useToast } from '@/hooks/use-toast';
// import { DataType } from '../types';
// import { getSearchFields, applyStatusFilter } from '../utils';
// import { useAuth } from '@/hooks/useAuth'; // Make sure useAuth is imported

// export const useDetailedViewData = (
//   type: DataType,
//   open: boolean,
//   initialData?: any[],
//   defaultFilter?: string
// ) => {
//   const { profile } = useAuth(); // Import profile from useAuth
//   const [data, setData] = useState<any[]>([]);
//   const [filteredData, setFilteredData] = useState<any[]>([]);
//   const [loading, setLoading] = useState(false);
//   const [searchTerm, setSearchTerm] = useState('');
//   const [filterValue, setFilterValue] = useState('all');
//   const { toast } = useToast();

//   useEffect(() => {
//     if (open) {
//       setFilterValue(defaultFilter || 'all');
//       setSearchTerm('');
//     }
//   }, [open, defaultFilter]);

//   // IMPORTANT: We remove 'my-interviews' from here because it's handled in fetchData
//   const buildQuery = useCallback(() => {
//     switch (type) {
//       case 'users':
//         return supabase.from('profiles').select('*, created_at').order('created_at', { ascending: false });
//       case 'companies':
//         return supabase.from('companies').select('*').order('created_at', { ascending: false });
//       case 'vendors':
//         return supabase.from('vendors').select(`*, companies (name)`).order('created_at', { ascending: false });
//       case 'jobs':
//       case 'activeJobs':
//         return supabase.from('jobs').select(`*, companies (name), profiles!jobs_created_by_fkey (first_name, last_name), job_applications (id, status)`).order('created_at', { ascending: false });
//       case 'applications':
//         return supabase.from('job_applications').select(`id, status, screening_score, applied_at, jobs!inner(title, companies!inner(name)), candidates!inner(profiles!inner(first_name, last_name, email))`).order('applied_at', { ascending: false });
//       case 'monthlyHires':
//         const monthAgo = new Date();
//         monthAgo.setMonth(monthAgo.getMonth() - 1);
//         return supabase.from('job_applications').select(`*, jobs (title, companies (name)), candidates (first_name, last_name, email)`).eq('status', 'hired').gte('updated_at', monthAgo.toISOString()).order('updated_at', { ascending: false });
//       case 'my-applications':
//       case 'in-review':
//         return supabase.from('job_applications').select('id, applied_at, status, jobs!inner(title, companies(name))').in('status', ['screening', 'interviewing', 'testing']).order('applied_at', { ascending: false });
//       case 'scheduledInterviews':
//         // This is for the CLIENT dashboard and remains unchanged
//         return supabase.from('interview_schedules').select(`id, scheduled_at, status, interview_type, job_applications!inner (jobs!inner (title, companies!inner (name)), candidates!inner (profiles!inner (first_name, last_name, email)))`).order('scheduled_at', { ascending: false });
//       default:
//         return null;
//     }
//   }, [type]);

//   const fetchData = useCallback(async () => {
//     if (!open || !profile?.id) return;
//     if (initialData) {
//       setData(initialData);
//       return;
//     }

//     setLoading(true);
//     try {
//       let query; // This will hold the query to be executed

//       // --- START: CORRECTED LOGIC ---
//       if (type === 'my-interviews') {
//         // This is for the CANDIDATE dashboard
//         const { data: candidate, error: candidateError } = await supabase
//           .from('candidates')
//           .select('id')
//           .eq('profile_id', profile.id)
//           .single();
        
//         if (candidateError) throw new Error("Could not find your candidate profile.");

//         // We build the specific query for the candidate right here
//         query = supabase
//           .from('interview_schedules')
//           .select('id, scheduled_at, status, interview_type, job_applications!inner(candidate_id, jobs!inner(title, companies(name)))')
//           .eq('job_applications.candidate_id', candidate.id);
//       } else {
//         // This is the original, safe logic for all OTHER dashboards
//         query = buildQuery();
//       }
//       // --- END: CORRECTED LOGIC ---

//       if (!query) {
//         setData([]);
//         setLoading(false);
//         return;
//       }

//       const { data: result, error } = await query;
//       if (error) throw error;
//       setData(result || []);

//     } catch (error: any) {
//       toast({ title: "Error", description: error.message, variant: "destructive" });
//       setData([]);
//     } finally {
//       setLoading(false);
//     }
//   }, [open, profile, type, initialData, buildQuery, toast]); // Added profile and type to dependencies

//   const filterData = useCallback(() => {
//     const sourceData = data || [];
//     let filtered = sourceData;
//     if (searchTerm) {
//       filtered = filtered.filter((item) => {
//         const searchFields = getSearchFields(item, type);
//         return searchFields.some(field => field?.toString().toLowerCase().includes(searchTerm.toLowerCase()));
//       });
//     }
//     filtered = filtered.filter((item) => applyStatusFilter(item, type, filterValue));
//     setFilteredData(filtered);
//   }, [data, searchTerm, filterValue, type]);

//   useEffect(() => {
//     if (open) {
//       fetchData();
//     }
//   }, [open, fetchData]);

//   useEffect(() => {
//     filterData();
//   }, [data, searchTerm, filterValue, type]); // This is correct for working filters

//   return {
//     data,
//     filteredData,
//     loading,
//     searchTerm,
//     filterValue,
//     setSearchTerm,
//     setFilterValue,
//     refetchData: fetchData
//   };
// };