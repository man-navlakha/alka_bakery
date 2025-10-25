import React, { useEffect, useState } from "react";

export default function Profile() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    fetch("http://localhost:3000/api/auth/me", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => res.json())
      .then(setUser)
      .catch(console.error);
  }, []);

  if (!user) return <div className="p-10 text-center">Loading profile...</div>;

  return (
    <div className="p-10 text-center">
      <h1 className="text-2xl font-bold mb-2 text-pink-600">Welcome, {user.name}!</h1>
      <p className="text-gray-700">Email: {user.email}</p>
    </div>
  );
}
