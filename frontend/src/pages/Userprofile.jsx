import { useState } from "react";
import ProfileHeader from "../components/ui/Profile/ProfileHeader.jsx";
import AccountInformation from "../components/ui/Profile/AccountInformation.jsx";
import RecentAnnotations from "../components/ui/Profile/RecentAnnotation.jsx";
import ProfileFooter from "../components/ui/Profile/ProfileFooter.jsx";
import { useAuth } from "@/hooks/useAuth";

export default function Profile() {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);

  // Use real user data from Firebase
  const mockUserData = {
    name: user?.displayName || "User",
    username: user?.email?.split("@")[0] || "user",
    bio: "Data annotation specialist passionate about creating high-quality labeled datasets for AI applications.",
    email: user?.email || "user@example.com",
    phone: "+ 855 123 456 789",
    joinedDate: user?.metadata?.creationTime
      ? new Date(user.metadata.creationTime).toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        })
      : "January 1, 2025",
    role: "Researcher",
    organization: "CADT",
    photoURL: user?.photoURL,
  };
  const [userData, setUserData] = useState(mockUserData);

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

  const handleUpdateProfile = (updatedData) => {
    setUserData({ ...userData, ...updatedData });
    setIsEditing(false);
  };

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
