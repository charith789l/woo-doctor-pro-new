
import React, { useState, useEffect } from 'react';
import { StoreSelector } from '@/components/products/StoreSelector';
import { useToast } from '@/hooks/use-toast';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { useAuthStore } from '@/store/authStore';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface Profile {
  id: string;
  username: string | null;
  avatar_url: string | null;
}

const DashboardHeader = () => {
  const [selectedStoreId, setSelectedStoreId] = useState<string | undefined>(
    localStorage.getItem('selectedStoreId') || undefined
  );
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuthStore();
  
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!user) return;
      
      setLoading(true);
      try {
        // Use proper RLS-compliant query
        const { data, error } = await supabase
          .from('profiles')
          .select('id, username, avatar_url')
          .eq('id', user.id)
          .maybeSingle();
          
        if (error) {
          console.error('Error fetching profile:', error);
          return;
        }
        
        if (data) {
          setProfile(data);
        }
      } catch (err) {
        console.error('Error in profile fetch:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchUserProfile();
  }, [user]);
  
  const handleStoreChange = (storeId: string) => {
    setSelectedStoreId(storeId);
    localStorage.setItem('selectedStoreId', storeId);
    toast({
      title: "Store Changed",
      description: "You're now viewing a different store",
    });
  };

  // Determine which avatar URL to use with proper fallback hierarchy
  const avatarUrl = profile?.avatar_url || 
                    user?.user_metadata?.avatar_url || 
                    user?.user_metadata?.picture;

  return (
    <div className="sticky top-0 z-30 flex justify-between items-center w-full p-4 bg-card dark:bg-card border-b dark:border-border shadow-sm">
      <div className="flex items-center gap-4 ml-3">
        <div className="relative">
          <Avatar className="h-16 w-16 border-2 border-border shadow-sm">
            {loading ? (
              <AvatarFallback className="bg-primary/5">
                <Loader2 className="h-8 w-8 text-primary animate-spin" />
              </AvatarFallback>
            ) : (
              <>
                <AvatarImage src={avatarUrl} alt={user?.email || 'User'} />
                <AvatarFallback className="bg-primary/10 dark:bg-primary/20">
                  <User className="h-8 w-8 text-primary" />
                </AvatarFallback>
              </>
            )}
          </Avatar>
        </div>
        
        <div className="flex flex-col">
          <p className="text-base font-medium text-foreground dark:text-white">
            Welcome, {profile?.username || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User'}
          </p>
          <p className="text-sm text-muted-foreground dark:text-gray-400">
            {user?.email}
          </p>
        </div>
      </div>
      <div className="flex-1 max-w-md ml-auto flex items-center gap-4 justify-end mr-3">
        <ThemeToggle />
        <StoreSelector 
          onStoreSelect={handleStoreChange} 
          selectedStoreId={selectedStoreId}
        />
      </div>
    </div>
  );
};

export default DashboardHeader;
