

import axios from "axios";
import { useState, useEffect } from "react";
import api from "../lib/api";

type UserData = {
    firstName: string;
    lastName: string;
    email: string;
    role: string;
}

const Profile = () => {
    const [userData, setUserData] = useState<UserData | null>(null);
    
    useEffect(() => {
        const id = localStorage.getItem("userId");
        const fetchUserData = async () => {
            try {
                const response = await api.get(`/api/user/profile/${id}`);
                console.log("User data fetched:", response.data);
                setUserData(response.data.data);
            } catch (error) {
                console.error("Error fetching user data:", error);
            }
            
        }
        fetchUserData();
        }, [])

    
        
    return (
        <>
        <h1>Profile</h1>
        <p>Name: {userData?.firstName} {userData?.lastName}</p>
        <p>Email: {userData?.email}{userData?.email && `@purdue.edu`}</p>
        <p>Role: {userData?.role}</p>
        </>
    )


}

export default Profile;