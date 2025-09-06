import { ArrowLeft, PersonCircle } from "react-bootstrap-icons";
import "../styles/Base.css";
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";

function ProfileComponent({ user, onSubmit }) {
  const [profile, setProfile] = useState("");
  const [userName, setUserName] = useState("");
  const [email, setEmail] = useState("");
  const [nickName, setNickName] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [bio, setBio] = useState("");

  useEffect(() => {
    if (user) {
      setProfile(user.profile || "");
      setUserName(user.username || "");
      setEmail(user.email || "");
      setNickName(user.nickname || "");
      setFirstName(user.first_name || "");
      setLastName(user.last_name || "");
      setBio(user.bio || "");
    }
  }, [user]);

  useEffect(() => {
    return () => {
      if (profile instanceof File) {
        URL.revokeObjectURL(profile);
      }
    };
  }, [profile]);

  if (!user) return <div>Loading...</div>;

  return (
    <div className="theme-gray min-vh-100 w-100">
      <div className="p-3">
        <Link to="/" className="text-decoration-none text-white d-flex align-items-center">
          <ArrowLeft className="me-2" />
          Go Back
        </Link>
      </div>

      <div className="row m-0 w-100">
        {/* Left Column */}
        <div className="col-12 col-lg-4 p-3">
          <div className="card h-100 theme-light-gray p-3">
            <div className="text-center">
              {profile ? (
                <img
                  src={profile instanceof File ? URL.createObjectURL(profile) : profile}
                  alt="avatar"
                  className="rounded-circle img-fluid"
                  style={{ width: "150px", height: "150px", objectFit: "cover" }}
                />
              ) : (
                <PersonCircle size={150} />
              )}
              <input
                className="form-control form-control-sm mt-2"
                id="formFileSm"
                type="file"
                accept="image/*"
                onChange={(e) => {
                  setProfile(e.target.files[0]);
                }}
                style={{ height: "5px", textAlign: "center" }}
              />
              <h5 className="my-3">
                <input
                  type="text"
                  value={nickName}
                  className="input-style theme-lighter-gray"
                  onChange={(e) => setNickName(e.target.value)}
                  placeholder="Nick Name"
                />
              </h5>
              <input
                type="text"
                value={bio}
                className="mb-2 input-style theme-lighter-gray"
                onChange={(e) => setBio(e.target.value)}
                placeholder="Bio"
              />
              <div className="d-flex justify-content-center mb-2 mt-2">
                <button type="button" className="btn btn-primary me-2">
                  Follow
                </button>
                <button type="button" className="btn btn-outline-primary">
                  Message
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="col-12 col-lg-8 p-3">
          <div className="card theme-light-gray p-3">
            <div className="row mb-3">
              <div className="col-sm-3">
                <p className="mb-0">First Name:</p>
              </div>
              <div className="col-sm-9">
                <input
                  type="text"
                  value={firstName}
                  className="input-style theme-lighter-gray"
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="First Name"
                />
              </div>
            </div>
            <div className="row mb-3">
              <div className="col-sm-3">
                <p className="mb-0">Last Name:</p>
              </div>
              <div className="col-sm-9">
                <input
                  type="text"
                  value={lastName}
                  className="input-style theme-lighter-gray"
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Last Name"
                />
              </div>
            </div>
            <div className="row mb-3">
              <div className="col-sm-3">
                <p className="mb-0">Username:</p>
              </div>
              <div className="col-sm-9">
                <input
                  type="text"
                  value={userName}
                  className="input-style theme-lighter-gray"
                  onChange={(e) => setUserName(e.target.value)}
                  placeholder="Username"
                />
              </div>
            </div>
            <div className="row mb-3">
              <div className="col-sm-3">
                <p className="mb-0">Email:</p>
              </div>
              <div className="col-sm-9">
                <input
                  type="text"
                  value={email}
                  className="input-style theme-lighter-gray"
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email"
                />
              </div>
            </div>
          </div>
          <div className="text-end mt-3">
            <button
              type="button"
              className="btn btn-success submit-button"
              onClick={() =>
                onSubmit({
                  profile: profile,
                  username: userName,
                  email: email,
                  nickname: nickName,
                  first_name: firstName,
                  last_name: lastName,
                  bio: bio,
                })
              }
            >
              Update
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProfileComponent;
