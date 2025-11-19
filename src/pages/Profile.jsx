import { useState, useEffect } from "react";
import { useAuth } from "../Context/AuthProvider";
import { User, Mail, Calendar, LogOut, Save } from "lucide-react";
import toast from "react-hot-toast";

export default function Profile() {
  const { user, logout, API_URL } = useAuth();
  const [name, setName] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [loading,SL] = useState(false);

  // Initialize state with user data
  useEffect(() => {
    if (user) {
      setName(user.name);
    }
  }, [user]);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    SL(true);
    const token = localStorage.getItem("accessToken");

    try {
      const res = await fetch(`${API_URL}/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      toast.success("Profile updated successfully");
      setIsEditing(false);
      // Ideally, you'd update the user in AuthContext here too, but a page refresh works for now
      window.location.reload(); 
    } catch (error) {
      toast.error(error.message || "Failed to update profile");
    } finally {
      SL(false);
    }
  };

  if (!user) return <div className="text-center mt-20">Loading profile...</div>;

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        
        {/* Header */}
        <div className="bg-white shadow rounded-lg overflow-hidden mb-6">
          <div className="bg-amber-600 h-32"></div>
          <div className="px-4 sm:px-6 -mt-12 flex justify-between items-end">
            <div className="flex items-end">
                {/* Avatar Placeholder */}
              <div className="h-24 w-24 rounded-full ring-4 ring-white bg-amber-200 flex items-center justify-center text-4xl">
                🥯
              </div>
              <div className="ml-4 mb-3">
                <h1 className="text-2xl font-bold text-gray-900">{user.name}</h1>
                <p className="text-sm text-gray-500">{user.role === 'admin' ? 'Admin' : 'Customer'}</p>
              </div>
            </div>
            <div className="mb-3">
                <button 
                    onClick={logout}
                    className="flex items-center px-4 py-2 border border-red-300 text-red-700 bg-white rounded-md hover:bg-red-50 transition text-sm font-medium"
                >
                    <LogOut size={16} className="mr-2" /> Logout
                </button>
            </div>
          </div>
        </div>

        {/* Profile Details Form */}
        <div className="bg-white shadow rounded-lg p-6">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-800">Personal Information</h2>
                <button 
                    onClick={() => setIsEditing(!isEditing)}
                    className="text-amber-600 hover:text-amber-800 text-sm font-medium"
                >
                    {isEditing ? "Cancel" : "Edit Profile"}
                </button>
            </div>

            <form onSubmit={handleUpdateProfile} className="space-y-6">
                {/* Name Field */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                    <div className="relative rounded-md shadow-sm">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <User className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                            type="text"
                            disabled={!isEditing}
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className={`block w-full pl-10 pr-3 py-2 sm:text-sm rounded-md ${
                                isEditing 
                                ? "border border-gray-300 focus:ring-amber-500 focus:border-amber-500" 
                                : "bg-gray-50 border-transparent text-gray-500"
                            }`}
                        />
                    </div>
                </div>

                {/* Email Field (Read Only) */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                    <div className="relative rounded-md shadow-sm">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Mail className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                            type="email"
                            disabled
                            value={user.email}
                            className="block w-full pl-10 pr-3 py-2 sm:text-sm rounded-md bg-gray-50 border-transparent text-gray-500 cursor-not-allowed"
                        />
                    </div>
                    <p className="mt-1 text-xs text-gray-400">Email cannot be changed.</p>
                </div>

                {/* Joined Date */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Member Since</label>
                    <div className="relative rounded-md shadow-sm">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Calendar className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                            type="text"
                            disabled
                            value={new Date(user.created_at).toLocaleDateString()}
                            className="block w-full pl-10 pr-3 py-2 sm:text-sm rounded-md bg-gray-50 border-transparent text-gray-500"
                        />
                    </div>
                </div>

                {/* Save Button */}
                {isEditing && (
                    <div className="flex justify-end">
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex items-center px-4 py-2 bg-amber-600 text-white rounded-md hover:bg-amber-700 transition disabled:opacity-50"
                        >
                            <Save size={18} className="mr-2" />
                            {loading ? "Saving..." : "Save Changes"}
                        </button>
                    </div>
                )}
            </form>
        </div>
      </div>
    </div>
  );
}