import { useState, useEffect } from "react";
import ProfileHeader from "../components/ui/Profile/ProfileHeader.jsx";
import AccountInformation from "../components/ui/Profile/AccountInformation.jsx";
import RecentAnnotations from "../components/ui/Profile/RecentAnnotation.jsx";
import ProfileFooter from "../components/ui/Profile/ProfileFooter.jsx";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/api";
import { toast } from "react-toastify";

export default function Profile() {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch user profile from MongoDB
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const response = await apiRequest("/users/profile");
        if (response.ok) {
          const data = await response.json();
          const dbUser = data.user;

          // Format user data for display
          const formattedUser = {
            id: dbUser.id,
            name: dbUser.name || "User",
            username: dbUser.email?.split("@")[0] || "user",
            bio: dbUser.bio || "",
            email: dbUser.email,
            phone: dbUser.phoneNumber || "",
            joinedDate: new Date(dbUser.created_at).toLocaleDateString(
              "en-US",
              {
                year: "numeric",
                month: "long",
                day: "numeric",
              },
            ),
            role: dbUser.role || "",
            organization: dbUser.organization || "",
            profileImage: dbUser.profilePhoto || user?.photoURL,
            coverImage: dbUser.coverPhoto || "",
          };

          setUserData(formattedUser);
        } else {
          toast.error("Failed to load profile");
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
        toast.error("Error loading profile");
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchUserProfile();
    }
  }, [user]);

  const recentAnnotations = [
    {
      id: 1,
      imageName: "angkor_wat_temple_01.jpg",
      category: "Historical Monument",
      timestamp: "2 hours ago",
      status: "completed",
    },
    {
      id: 2,
      imageName: "khmer_traditional_dance.jpg",
      category: "Cultural Activity",
      timestamp: "5 hours ago",
      status: "completed",
    },
    {
      id: 3,
      imageName: "phnom_penh_street_view.jpg",
      category: "Urban Landscape",
      timestamp: "1 day ago",
      status: "completed",
    },
    {
      id: 4,
      imageName: "cambodian_cuisine_amok.jpg",
      category: "Food & Cuisine",
      timestamp: "1 day ago",
      status: "completed",
    },
    {
      id: 5,
      imageName: "tonle_sap_lake.jpg",
      category: "Natural Landscape",
      timestamp: "2 days ago",
      status: "completed",
    },
  ];

  const handleUpdateProfile = async (updatedData) => {
    try {
      // Prepare data for API (convert to database field names)
      const updatePayload = {
        name: updatedData.name,
        bio: updatedData.bio,
        phoneNumber: updatedData.phone,
        role: updatedData.role,
        organization: updatedData.organization,
      };

      // Add profile and cover images if they were updated
      if (
        updatedData.profileImage &&
        updatedData.profileImage !== userData.profileImage
      ) {
        updatePayload.profilePhoto = updatedData.profileImage;
      }
      if (
        updatedData.coverImage &&
        updatedData.coverImage !== userData.coverImage
      ) {
        updatePayload.coverPhoto = updatedData.coverImage;
      }

      const response = await apiRequest("/users/profile", {
        method: "PUT",
        body: JSON.stringify(updatePayload),
      });

      if (response.ok) {
        const data = await response.json();
        const dbUser = data.user;

        // Update local state with response from server
        const formattedUser = {
          id: dbUser.id,
          name: dbUser.name || "User",
          username: dbUser.email?.split("@")[0] || "user",
          bio: dbUser.bio || "",
          email: dbUser.email,
          phone: dbUser.phoneNumber || "",
          joinedDate: new Date(dbUser.created_at).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          }),
          role: dbUser.role || "",
          organization: dbUser.organization || "",
          profileImage: dbUser.profilePhoto || user?.photoURL,
          coverImage: dbUser.coverPhoto || "",
        };

        setUserData(formattedUser);
        setIsEditing(false);
        toast.success("Profile updated successfully!");
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to update profile");
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Error updating profile");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-gray-600">Loading profile...</div>
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-gray-600">Failed to load profile</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <ProfileHeader
          userData={userData}
          isEditing={isEditing}
          onUpdate={handleUpdateProfile}
        />

        <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
          <AccountInformation
            userData={userData}
            onEditClick={() => setIsEditing(!isEditing)}
            isEditing={isEditing}
            onUpdate={handleUpdateProfile}
          />
          <RecentAnnotations annotations={recentAnnotations} />
        </div>

        <ProfileFooter email={userData.email} />
      </div>
    </div>
  );
}
