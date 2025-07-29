import { Gear, PersonCircle } from 'react-bootstrap-icons';
import { Link } from "react-router-dom";
import "../styles/Home.css";
import "../styles/Base.css";

function HomeComponent({user}) {
    return (
        <div className="d-flex">
            <div className="theme-dark side-container">
                {/* Search box */}
                <div className="input-group search-box">
                    <button className="rounded-circle bars-button theme-gray" type="button"
                        data-bs-toggle="offcanvas"
                        data-bs-target="#offcanvasWithBothOptions"
                        aria-controls="offcanvasWithBothOptions">
                        <i className="fa-solid fa-bars"></i>
                    </button>
                    <input type="text" className="ms-2 rounded-pill text-white theme-gray" placeholder="  search" />
                </div>

                {/* Offcanvas */}
                <div className="offcanvas offcanvas-start theme-gray"
                    data-bs-scroll="true" tabIndex="-1"
                    id="offcanvasWithBothOptions"
                    aria-labelledby="offcanvasWithBothOptionsLabel">
                    <div className="offcanvas-header">
                        <button type="button" className="btn-close" data-bs-dismiss="offcanvas" aria-label="Close"></button>
                    </div>
                    <div className="offcanvas-body">
                        <Link to="/profile/" className="text-decoration-none text-white">
                            <div className="offcanvas-section p-2 rounded-4">
                                {user && user.profile ? (
                                    <img className="rounded-circle" src={user.profile} width="45" height="45" />
                                ) : (
                                    <PersonCircle size={35} />
                                )}
                                <span className="ms-3 mt-1">
                                    {user?.nickname} 
                                </span>
                                <div className="d-inline-flex position-absolute end-0 me-5 mt-1">
                                    <Gear size={35}/>
                                </div>           
                            </div>
                            
                        </Link>
                        <hr />
                    </div>
                </div>

                {/* Chats section */}
                <div className="overflow-auto text-white chats-section theme-dark">
                    <div className="list-group">
                        <a href="#" className="list-group-item d-flex align-items-start chat-preview theme-gray">
                            <img src="https://avatars.githubusercontent.com/u/120246081?v=4" className="chat-avatar me-3" />
                            <div className="d-flex flex-column justify-content-between flex-grow-1 chat-body">
                                <div className="d-flex justify-content-between">
                                    <div className="fw-bold">John Doe</div>
                                    <div className="text-white small">12:45</div>
                                </div>
                                <div className="text-white small">Last message preview text...</div>
                            </div>
                        </a>
                    </div>
                </div>
            </div>

            {/* Main chat */}
            <div className="flex-grow-1 text-white bg-secondary main-chat d-flex flex-column p-3">
                <div className="d-flex align-items-start rounded-4 p-2 mb-2 chat-message-recieved">
                    <img src="https://avatars.githubusercontent.com/u/120246081?v=4" className="chat-avatar me-3" />
                    <div className="d-flex flex-column">
                        <div className="d-flex justify-content-between">
                            <div className="fw-bold">Kian</div>
                            <div className="text-white-50 small ms-3">12:30PM</div>
                        </div>
                        <div>How do you do?</div>
                    </div>
                </div>

                <div className="d-flex align-items-start rounded-4 p-2 mb-2 chat-message-sent">
                    <div className="d-flex flex-column">
                        <div className="d-flex justify-content-between">
                            <div className="text-white-50 small me-3">12:30PM</div>
                            <div className="fw-bold">You</div>
                        </div>
                        <div>How do you do?</div>
                    </div>
                    <img src="https://avatars.githubusercontent.com/u/120246081?v=4" className="chat-avatar ms-3" />
                </div>
            </div>
        </div>
    );
}

export default HomeComponent;
