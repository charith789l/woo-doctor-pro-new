import { useState, useEffect, useRef } from "react";
import { useAuthStore } from "@/store/authStore";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress"; 
import { 
  Loader2, 
  UserCircle, 
  Save, 
  Mail, 
  Calendar, 
  Clock,
  User,
  Info,
  Upload,
  Trash2
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useIsMobile } from "@/hooks/use-mobile";

interface Profile {
  id: string;
  username: string | null;
  avatar_url: string | null;
  created_at: string | null;
  updated_at: string | null;
}

const Profile = () => {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [username, setUsername] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const isMobile = useIsMobile();

  useEffect(() => {
    if (!user) return;
    
    async function fetchProfile() {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .maybeSingle();

        if (error) throw error;
        
        if (data) {
          setProfile(data);
          setUsername(data.username || "");
          setAvatarUrl(data.avatar_url);
        }
      } catch (error: any) {
        console.error("Error fetching profile:", error.message);
        toast({
          title: "Error fetching profile",
          description: error.message,
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    }

    fetchProfile();
  }, [user, toast]);

  const updateProfile = async () => {
    if (!user) return;
    
    setSaving(true);
    try {
      const updates = {
        username,
        updated_at: new Date().toISOString(),
        avatar_url: avatarUrl
      };

      const { error } = await supabase
        .from("profiles")
        .update(updates)
        .eq("id", user.id);

      if (error) throw error;
      
      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully.",
      });
      
      const { data: updatedProfile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();
        
      if (updatedProfile) {
        setProfile(updatedProfile);
      }
    } catch (error: any) {
      console.error("Error updating profile:", error.message);
      toast({
        title: "Error updating profile",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const uploadAvatar = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      setUploadProgress(0);
      
      if (!event.target.files || event.target.files.length === 0) {
        throw new Error("You must select an image to upload.");
      }

      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const filePath = `${user?.id}/${Math.random().toString(36).substring(2)}.${fileExt}`;

      if (file.size > 2 * 1024 * 1024) {
        throw new Error("File size should not exceed 2MB");
      }

      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        throw new Error("File type not supported. Please upload JPEG, PNG, GIF or WEBP.");
      }

      const { data: buckets } = await supabase.storage.listBuckets();
      const avatarBucketExists = buckets?.some(bucket => bucket.name === 'avatars');
      
      if (!avatarBucketExists) {
        await supabase.storage.createBucket('avatars', {
          public: true
        });
      }

      const uploadTask = async () => {
        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: true,
          });

        if (uploadError) {
          throw uploadError;
        }
      };

      const progressInterval = setInterval(() => {
        setUploadProgress((prevProgress) => {
          const newProgress = prevProgress + 10;
          return newProgress >= 90 ? 90 : newProgress;
        });
      }, 300);

      await uploadTask();
      
      clearInterval(progressInterval);
      setUploadProgress(100);

      const { data } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      if (data) {
        setAvatarUrl(data.publicUrl);
        
        await supabase
          .from("profiles")
          .update({ 
            avatar_url: data.publicUrl,
            updated_at: new Date().toISOString()
          })
          .eq("id", user?.id);
          
        toast({
          title: "Avatar uploaded",
          description: "Your profile picture has been updated successfully.",
        });
        
        const { data: updatedProfile } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user?.id)
          .maybeSingle();
          
        if (updatedProfile) {
          setProfile(updatedProfile);
        }
      }
    } catch (error: any) {
      console.error("Error uploading avatar:", error.message);
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      setUploadProgress(0);
      
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const removeAvatar = async () => {
    if (!user || !avatarUrl) return;
    
    try {
      setUploading(true);
      
      const { error } = await supabase
        .from("profiles")
        .update({ 
          avatar_url: null,
          updated_at: new Date().toISOString()
        })
        .eq("id", user.id);

      if (error) throw error;
      
      setAvatarUrl(null);
      
      toast({
        title: "Avatar removed",
        description: "Your profile picture has been removed.",
      });
    } catch (error: any) {
      console.error("Error removing avatar:", error.message);
      toast({
        title: "Error removing avatar",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <DashboardLayout>
      <div className="w-full px-4 py-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1">
            <Card className="h-full">
              <CardHeader>
                <CardTitle className="text-xl font-bold flex items-center gap-2 dark:text-white">
                  <User className="h-5 w-5" />
                  Profile Information
                </CardTitle>
                <CardDescription className="dark:text-gray-300">
                  Your account details
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {loading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 text-primary animate-spin" />
                  </div>
                ) : (
                  <>
                    <div className="flex flex-col items-center py-4 relative">
                      <div className="relative w-32 h-32 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center group">
                        {avatarUrl ? (
                          <img
                            src={avatarUrl}
                            alt="Avatar"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <UserCircle className="h-20 w-20 text-gray-400" />
                        )}
                        
                        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="text-white text-xs text-center">
                            <Upload className="h-6 w-6 mx-auto" />
                            <span>Update</span>
                          </div>
                        </div>

                        <input
                          type="file"
                          id="avatar"
                          ref={fileInputRef}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                          accept="image/*"
                          onChange={uploadAvatar}
                          disabled={uploading}
                        />
                      </div>
                      
                      <div className="mt-4 flex flex-col space-y-2 w-full">
                        {uploading && (
                          <div className="w-full space-y-1">
                            <Progress value={uploadProgress} className="h-1" />
                            <p className="text-xs text-center text-muted-foreground">
                              Uploading... {uploadProgress}%
                            </p>
                          </div>
                        )}
                        
                        <div className="flex justify-center gap-2">
                          <Button 
                            type="button" 
                            variant="outline"
                            size="sm"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={uploading}
                            className="text-xs"
                          >
                            <Upload className="h-3 w-3 mr-1" />
                            Choose File
                          </Button>
                          
                          {avatarUrl && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={removeAvatar}
                              disabled={uploading}
                              className="text-xs text-destructive border-destructive hover:bg-destructive/10"
                            >
                              <Trash2 className="h-3 w-3 mr-1" />
                              Remove
                            </Button>
                          )}
                        </div>
                        
                        <p className="text-xs text-center text-muted-foreground mt-1">
                          JPG, PNG or GIF (max. 2MB)
                        </p>
                      </div>
                    </div>

                    <div className="space-y-4 divide-y dark:divide-gray-700">
                      <div className="pt-2">
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                          <Mail className="h-4 w-4 inline mr-2" />
                          Email
                        </p>
                        <p className="font-medium dark:text-white">{user?.email || "N/A"}</p>
                      </div>
                      
                      <div className="pt-2">
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                          <User className="h-4 w-4 inline mr-2" />
                          Username
                        </p>
                        <p className="font-medium dark:text-white">{profile?.username || "Not set"}</p>
                      </div>

                      <div className="pt-2">
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                          <Calendar className="h-4 w-4 inline mr-2" />
                          Account Created
                        </p>
                        <p className="font-medium dark:text-white">
                          {formatDate(profile?.created_at || null)}
                        </p>
                      </div>

                      <div className="pt-2">
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                          <Clock className="h-4 w-4 inline mr-2" />
                          Last Updated
                        </p>
                        <p className="font-medium dark:text-white">
                          {formatDate(profile?.updated_at || null)}
                        </p>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="md:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-xl font-bold flex items-center gap-2 dark:text-white">
                  <Info className="h-5 w-5" />
                  Edit Profile
                </CardTitle>
                <CardDescription className="dark:text-gray-300">
                  Update your profile information
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 text-primary animate-spin" />
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="email" className="dark:text-gray-200">Email Address</Label>
                      <Input
                        id="email"
                        type="email"
                        value={user?.email || ""}
                        disabled
                        className="bg-gray-50 dark:bg-gray-800 dark:text-gray-300"
                      />
                      <p className="text-sm text-muted-foreground dark:text-gray-400">
                        Your email address is associated with your account and cannot be changed
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="username" className="dark:text-gray-200">Username</Label>
                      <Input
                        id="username"
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="Enter your username"
                        className="dark:bg-gray-800 dark:text-white dark:border-gray-700"
                      />
                      <p className="text-sm text-muted-foreground dark:text-gray-400">
                        Choose a username that will be displayed across the app
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="account-status" className="dark:text-gray-200">Account Status</Label>
                      <div className="p-3 bg-green-50 text-green-700 rounded-md border border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800">
                        <p className="font-medium flex items-center">
                          <span className="bg-green-100 dark:bg-green-800 p-1 rounded-full mr-2">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          </span>
                          Your account is active
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
              <CardFooter className={isMobile ? "flex-col space-y-4" : "justify-between"}>
                <div className="text-sm text-muted-foreground dark:text-gray-400">
                  Last updated: {profile?.updated_at 
                    ? new Date(profile.updated_at).toLocaleDateString() 
                    : "Never"}
                </div>
                <Button
                  onClick={updateProfile}
                  disabled={loading || saving}
                  className={`flex items-center gap-2 ${isMobile ? "w-full" : ""}`}
                >
                  {saving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  Save Changes
                </Button>
              </CardFooter>
            </Card>

            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="text-xl font-bold dark:text-white">Security Settings</CardTitle>
                <CardDescription className="dark:text-gray-300">
                  Manage your account security
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="font-medium dark:text-white">Two-factor Authentication</h4>
                      <p className="text-sm text-muted-foreground dark:text-gray-400">Add an extra layer of security</p>
                    </div>
                    <Button variant="outline" disabled>Coming Soon</Button>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="font-medium dark:text-white">Password</h4>
                      <p className="text-sm text-muted-foreground dark:text-gray-400">Change your password</p>
                    </div>
                    <Button variant="outline" disabled>Coming Soon</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Profile;
