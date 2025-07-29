import { useState, useEffect } from "react";
import HomeComponent from "../components/HomeComponent";
import api from "../api"; 

function Home() {
    const [user, setUser] = useState(null);

    useEffect(() => {
        fetchdata();
    }, []);

    const fetchdata = () => {
        api
            .get("/chat/")
            .then((res) => res.data)
            .then((data) => {
                setUser(data);
                console.log(data);
            })
            .catch((err) => alert(err));
    };

    return (
        <div>
            <HomeComponent user={user} />
        </div>
    );
}

export default Home