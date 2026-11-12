
import { useState } from "react";
import "./App.css";

import {
    loginUser,
    registerCitizen,
    logoutUser,
    getCurrentUser,
    submitGrievance,
    getDepartments,
    getMyGrievances,
    getAllGrievances,
    getOfficers,
    assignGrievance,
    getOfficerGrievances,
    updateOfficerGrievance
} from "./services/api";

function App() {

  const [page, setPage] = useState("home");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loggedIn, setLoggedIn] = useState(
    Boolean(localStorage.getItem("accessToken"))
    
    
  );
  const [currentUser, setCurrentUser] = useState(null);

  const [loginData, setLoginData] = useState({
    username: "",
    password: ""
  });
  // CMO Dashboard data
const [cmoGrievances, setCmoGrievances] = useState([]);
const [cmoLoading, setCmoLoading] = useState(false);
const [cmoError, setCmoError] = useState("");
// Officer list
const [officers, setOfficers] = useState([]);
// Officer Dashboard data
const [officerGrievances, setOfficerGrievances] = useState([]);
const [officerLoading, setOfficerLoading] = useState(false);
const [officerError, setOfficerError] = useState("");
const [officerMessage, setOfficerMessage] = useState("");

// Action taken report
const [officerReports, setOfficerReports] = useState({});
// Assignment form data
const [assignmentData, setAssignmentData] = useState({
    grievance: "",
    department: "",
    officer: "",
    remarks: ""
});

// Assignment loading and messages
const [assignmentLoading, setAssignmentLoading] = useState(false);
const [assignmentMessage, setAssignmentMessage] = useState("");
const [assignmentError, setAssignmentError] = useState("");
const [showAssignmentForm, setShowAssignmentForm] = useState(false);
// CMO Dashboard filters
const [districtFilter, setDistrictFilter] = useState("ALL");
const [categoryFilter, setCategoryFilter] = useState("ALL");
const [priorityFilter, setPriorityFilter] = useState("ALL");
const [statusFilter, setStatusFilter] = useState("ALL");
// Filter grievances based on selected filters
const filteredGrievances = cmoGrievances.filter((grievance) => {

    return (
        (districtFilter === "ALL" ||
            grievance.district === districtFilter) &&

        (categoryFilter === "ALL" ||
            grievance.category === categoryFilter) &&

        (priorityFilter === "ALL" ||
            grievance.priority === priorityFilter) &&

        (statusFilter === "ALL" ||
            grievance.status === statusFilter)
    );
});
  // Grievance form data
const [grievanceData, setGrievanceData] = useState({
    district: "",
    category: "",
    subject: "",
    description: ""
});

const [departments, setDepartments] = useState([]);
// Citizen grievance tracking
const [myGrievances, setMyGrievances] = useState([]);
const [trackingLoading, setTrackingLoading] = useState(false);
const [trackingError, setTrackingError] = useState("");

// Load grievances submitted by the logged-in citizen
async function handleLoadMyGrievances() {
    setTrackingLoading(true);
    setTrackingError("");
    setPage("track");

    try {
        const result = await getMyGrievances();
        setMyGrievances(result);
    } catch (error) {
        setTrackingError(error.message);
    } finally {
        setTrackingLoading(false);
    }
}
// Load all grievances for CMO
async function handleLoadCmoGrievances() {
    setCmoLoading(true);
    setCmoError("");

    try {
        const result = await getAllGrievances();
        setCmoGrievances(result.grievances);
        setPage("cmo");
    } catch (error) {
        setCmoError(error.message);
    } finally {
        setCmoLoading(false);
    }
}

// ADD THE NEW FUNCTION HERE
async function handleLoadAssignmentData() {
    setAssignmentError("");
    setAssignmentMessage("");

    try {
        const [departmentResult, officerResult] = await Promise.all([
            getDepartments(),
            getOfficers()
        ]);

        setDepartments(departmentResult);
        setOfficers(officerResult.officers);

    } catch (error) {
        setAssignmentError(error.message);
    }
}
// Load grievances assigned to the logged-in officer
async function handleLoadOfficerGrievances() {
    setOfficerLoading(true);
    setOfficerError("");
    setOfficerMessage("");

    try {
        const result = await getOfficerGrievances();

        setOfficerGrievances(result.grievances);
        setPage("officer");

    } catch (error) {
        setOfficerError(error.message);
    } finally {
        setOfficerLoading(false);
    }
}

 // Submit action taken report
async function handleOfficerReportSubmit(e, grievanceId) {
    e.preventDefault();

    const report = officerReports[grievanceId];

    if (!report || !report.trim()) {
        setOfficerError("Please enter an action taken report.");
        return;
    }

    setOfficerLoading(true);
    setOfficerError("");
    setOfficerMessage("");

    try {
        const result = await updateOfficerGrievance(
            grievanceId,
            report
        );

        setOfficerReports((previous) => ({
            ...previous,
            [grievanceId]: ""
        }));

        await handleLoadOfficerGrievances();

        setOfficerMessage(result.message);

    } catch (error) {
        setOfficerError(error.message);
    } finally {
        setOfficerLoading(false);
    }
}



// Assign grievance to an officer
async function handleAssignGrievance(e) {
    e.preventDefault();

    setAssignmentLoading(true);
    setAssignmentError("");
    setAssignmentMessage("");

    try {
        const result = await assignGrievance(assignmentData);

        setAssignmentMessage(result.message);

        setAssignmentData({
            grievance: "",
            department: "",
            officer: "",
            remarks: ""
        });

        await handleLoadCmoGrievances();

    } catch (error) {
        setAssignmentError(error.message);
    } finally {
        setAssignmentLoading(false);
    }
}
const [selectedFile, setSelectedFile] = useState(null);
const [grievanceLoading, setGrievanceLoading] = useState(false);
const [grievanceMessage, setGrievanceMessage] = useState("");
const [grievanceError, setGrievanceError] = useState("");

  const [registerData, setRegisterData] = useState({
    username: "",
    email: "",
    mobile: "",
    password: ""
  });

  // Handle login form
  async function handleLogin(e) {
  e.preventDefault();
  setLoading(true);
  setError("");
  setMessage("");

  try {
    await loginUser(loginData);

    const user = await getCurrentUser();

    setCurrentUser(user);
    setLoggedIn(true);
    setMessage("Login successful!");

    if (user.role === "CITIZEN") {
      setPage("citizen");
    }   else if (user.role === "CMO_ADMIN") {
      await handleLoadCmoGrievances();
    } else if (user.role === "OFFICER") {
    await handleLoadOfficerGrievances();
} else{
      setPage("home");
    }

  } catch (err) {
    logoutUser();
    setLoggedIn(false);
    setCurrentUser(null);
    setError(err.message);
  } finally {
    setLoading(false);
  }
}

  // Handle citizen registration
  async function handleRegister(e) {
    e.preventDefault();

    setLoading(true);
    setError("");
    setMessage("");

    try {
      await registerCitizen(registerData);

      setMessage("Registration successful! Please log in.");

      setLoginData({
        username: registerData.username,
        password: ""
      });

      setPage("login");

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

async function handleGrievanceSubmit(e) {
    e.preventDefault();

    setGrievanceLoading(true);
    setGrievanceMessage("");
    setGrievanceError("");

    try {
        const formData = new FormData();

        formData.append("district", grievanceData.district);
        formData.append("category", grievanceData.category);
        formData.append("subject", grievanceData.subject);
        formData.append("description", grievanceData.description);

        if (selectedFile) {
            formData.append("attachment", selectedFile);
        }

        const result = await submitGrievance(formData);

        setGrievanceMessage(
            `Grievance submitted successfully! Reference Number: ${result.reference_number}`
        );

        setGrievanceData({
            district: "",
            category: "",
            subject: "",
            description: ""
        });

        setSelectedFile(null);

    } catch (error) {
        setGrievanceError(error.message);
    } finally {
        setGrievanceLoading(false);
    }
}


  // Handle logout
  function handleLogout() {
  logoutUser();

  setLoggedIn(false);
  setCurrentUser(null);
  setMessage("You have logged out successfully.");
  setPage("home");
  }

  // Home page
  function HomePage() {
    return (
      <>
        <section className="hero">

          <h1>
            Chief Minister's Public Grievance Redressal Portal
          </h1>

          <p>
            Your voice matters. Submit your grievances directly
            through our platform and track their progress
            transparently.
          </p>

          <div className="hero-buttons">

            <button
              className="primary-btn"
              onClick={() => {
                setError("");
                setMessage("");

                setPage(loggedIn ? "submit" : "login");
              }}
            >
              Submit Grievance
            </button>

         <button
            className="secondary-btn"
            onClick={() => {
            setError("");
            setMessage("");

            if (loggedIn) {
              handleLoadMyGrievances();
              } else {
              setPage("login");
        }
    }}
>
    Track Grievance
</button>

          </div>
        </section>

        <section className="section" id="about">

          <h2>About the Portal</h2>

          <p className="section-desc">
            A digital platform designed to make public grievance
            submission and resolution transparent and accessible.
          </p>

        </section>

        <section className="section" id="departments">

          <h2>Government Departments</h2>

          <p className="section-desc">
            Grievances are directed to the relevant departments
            for appropriate action.
          </p>

          <div className="department-grid">

            <div className="department-card">
              <h3>Public Works Department</h3>
              <p>Roads, bridges and public infrastructure.</p>
            </div>

            <div className="department-card">
              <h3>Health Department</h3>
              <p>Healthcare facilities and public health services.</p>
            </div>

            <div className="department-card">
              <h3>Education Department</h3>
              <p>Schools, colleges and educational facilities.</p>
            </div>

          </div>
        </section>
      </>
    );
  }

  // Login page
  function LoginPage() {
    return (
      <section className="auth-section">

        <div className="auth-card">

          <h2>Citizen Login</h2>

          <p>Log in to access your grievance portal.</p>

          <form onSubmit={handleLogin}>

            <label>Username</label>

            <input
              type="text"
              value={loginData.username}
              onChange={(e) =>
                setLoginData({
                  ...loginData,
                  username: e.target.value
                })
              }
              placeholder="Enter your username"
              required
            />

            <label>Password</label>

            <input
              type="password"
              value={loginData.password}
              onChange={(e) =>
                setLoginData({
                  ...loginData,
                  password: e.target.value
                })
              }
              placeholder="Enter your password"
              required
            />

            <button
              type="submit"
              className="primary-btn auth-submit"
              disabled={loading}
            >
              {loading ? "Logging in..." : "Login"}
            </button>

          </form>

          <p>
            Don't have an account?{" "}
            <button
              className="text-btn"
              onClick={() => {
                setError("");
                setMessage("");
                setPage("register");
              }}
            >
              Register here
            </button>
          </p>

          <button
            className="text-btn"
            onClick={() => setPage("home")}
          >
            Back to Home
          </button>

        </div>

      </section>
    );
  }

  // Registration page
  function RegisterPage() {
    return (
      <section className="auth-section">

        <div className="auth-card">

          <h2>Citizen Registration</h2>

          <p>Create your account to submit grievances.</p>

          <form onSubmit={handleRegister}>

            <label>Full Name / Username</label>

            <input
              type="text"
              value={registerData.username}
              onChange={(e) =>
                setRegisterData({
                  ...registerData,
                  username: e.target.value
                })
              }
              placeholder="Enter your username"
              required
            />

            <label>Email Address</label>

            <input
              type="email"
              value={registerData.email}
              onChange={(e) =>
                setRegisterData({
                  ...registerData,
                  email: e.target.value
                })
              }
              placeholder="Enter your email"
              required
            />

            <label>Mobile Number</label>

            <input
              type="tel"
              value={registerData.mobile}
              onChange={(e) =>
                setRegisterData({
                  ...registerData,
                  mobile: e.target.value
                })
              }
              placeholder="Enter your mobile number"
              required
            />

            <label>Password</label>

            <input
              type="password"
              value={registerData.password}
              onChange={(e) =>
                setRegisterData({
                  ...registerData,
                  password: e.target.value
                })
              }
              placeholder="Minimum 8 characters"
              minLength={8}
              required
            />

            <button
              type="submit"
              className="primary-btn auth-submit"
              disabled={loading}
            >
              {loading ? "Registering..." : "Create Account"}
            </button>

          </form>

          <p>
            Already have an account?{" "}
            <button
              className="text-btn"
              onClick={() => {
                setError("");
                setMessage("");
                setPage("login");
              }}
            >
              Login
            </button>
          </p>

          <button
            className="text-btn"
            onClick={() => setPage("home")}
          >
            Back to Home
          </button>

        </div>

      </section>
    );
  }

  return (
    <div>

      {/* Navigation Bar */}
      <nav className="navbar">

        <div
          className="logo"
          onClick={() => setPage("home")}
        >
          CM Kerala
        </div>

        <div className="nav-links">

          <button onClick={() => setPage("home")}>
            Home
          </button>

          <a href="#about" onClick={() => setPage("home")}>
            About Us
          </a>

          <a href="#departments" onClick={() => setPage("home")}>
            Departments
          </a>

          <a href="#contact" onClick={() => setPage("home")}>
            Contact
          </a>

          {loggedIn ? (
            <button
              className="login-btn"
              onClick={handleLogout}
            >
              Logout
            </button>
          ) : (
            <button
              className="login-btn"
              onClick={() => {
                setError("");
                setMessage("");
                setPage("login");
              }}
            >
              Login
            </button>
          )}

        </div>

      </nav>

      {/* Success and error messages */}
      {message && (
        <div className="success-message">
          {message}
        </div>
      )}

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {/* Page Content */}
      {page === "home" && <HomePage />}

      {page === "login" && LoginPage()}

      {page === "register" && RegisterPage()}

      
{page === "submit" && (
    <section className="auth-section">
        <div className="auth-card">
            <h2>Submit a Grievance</h2>
            <p>Please provide the details of your complaint.</p>

            <form onSubmit={handleGrievanceSubmit}>

                <label>District</label>
                <select
                    value={grievanceData.district}
                    onChange={(e) => setGrievanceData({
                        ...grievanceData,
                        district: e.target.value
                    })}
                    required
                >
                    <option value="">Select District</option>
                    {[
                        "Thiruvananthapuram", "Kollam", "Pathanamthitta",
                        "Alappuzha", "Kottayam", "Idukki", "Ernakulam",
                        "Thrissur", "Palakkad", "Malappuram", "Kozhikode",
                        "Wayanad", "Kannur", "Kasaragod"
                    ].map((district) => (
                        <option key={district} value={district}>
                            {district}
                        </option>
                    ))}
                </select>

                <label>Category</label>
                
<select
    value={grievanceData.category}
    onChange={(e) => setGrievanceData({
        ...grievanceData,
        category: e.target.value
    })}
    required
>
    <option value="">Select Category</option>
    <option value="HEALTH">Health</option>
    <option value="EDUCATION">Education</option>
    <option value="PWD">Public Works</option>
    <option value="WATER">Water Supply</option>
    <option value="ELECTRICITY">Electricity</option>
    <option value="OTHER">Other</option>
</select>


                <label>Subject</label>
                <input
                    type="text"
                    placeholder="Enter complaint subject"
                    value={grievanceData.subject}
                    onChange={(e) => setGrievanceData({
                        ...grievanceData,
                        subject: e.target.value
                    })}
                    required
                />

                <label>Description</label>
                <textarea
                    placeholder="Describe your grievance"
                    rows="5"
                    value={grievanceData.description}
                    onChange={(e) => setGrievanceData({
                        ...grievanceData,
                        description: e.target.value
                    })}
                    required
                />

                <label>Upload Supporting Document (Optional)</label>
                <input
                    type="file"
                    accept="image/*,.pdf,.doc,.docx"
                    onChange={(e) => setSelectedFile(
                        e.target.files[0] || null
                    )}
                />

                {grievanceError && (
                    <p className="error-message">{grievanceError}</p>
                )}

                {grievanceMessage && (
                    <p className="success-message">{grievanceMessage}</p>
                )}

                <button type="submit" disabled={grievanceLoading}>
                    {grievanceLoading ? "Submitting..." : "Submit Grievance"}
                </button>

            </form>
        </div>
    </section>
)}


    
{page === "citizen" && (
    <section className="auth-section">
        <div className="auth-card">
            <h2>Citizen Dashboard</h2>
            <p>Welcome, {currentUser?.username}!</p>

            <button
              className="secondary-btn"
              onClick={handleLoadMyGrievances}
>
               Track My Grievances
            </button>
            
        </div>
    </section>
)}

{page === "track" && (
    <section className="auth-section">
        <div className="auth-card tracking-card">

            <h2>My Grievances</h2>

            <p>Track the status of your submitted complaints.</p>

            <button
                className="secondary-btn"
                onClick={() => setPage("citizen")}
            >
                Back to Dashboard
            </button>

            {trackingLoading ? (
                <p>Loading your grievances...</p>
            ) : trackingError ? (
                <p className="error-message">{trackingError}</p>
            ) : myGrievances.length === 0 ? (
                <p>You have not submitted any grievances yet.</p>
            ) : (
                myGrievances.map((grievance) => (
                    <div
                        className="grievance-item"
                        key={grievance.id}
                    >
                        <h3>{grievance.subject}</h3>

                        <p>
                            <strong>Reference:</strong>{" "}
                            {grievance.reference_number}
                        </p>

                        <p>
                            <strong>District:</strong>{" "}
                            {grievance.district}
                        </p>

                        <p>
                            <strong>Category:</strong>{" "}
                            {grievance.category}
                        </p>

                        <p>
                            <strong>Status:</strong>{" "}
                            {grievance.status}
                        </p>

                        <p>
                            <strong>Priority:</strong>{" "}
                            {grievance.priority}
                        </p>

                        <p>
                            <strong>Submitted:</strong>{" "}
                            {new Date(grievance.created_at).toLocaleString()}
                        </p>
                    </div>
                ))
            )}

        </div>
    </section>
)}




{page === "cmo" && (
  <section className="auth-section">
    <div className="auth-card tracking-card">

      <h2>CMO Dashboard</h2>
      <p>Welcome, {currentUser?.username}!</p>
    <button
    className="primary-btn"
    onClick={async () => {
        setAssignmentMessage("");
        setAssignmentError("");
        setShowAssignmentForm(true);
        await handleLoadAssignmentData();
    }}
>
    Assign Grievance
    </button>

      {cmoLoading ? (
        <p>Loading grievances...</p>
      ) : cmoError ? (
        <p className="error-message">{cmoError}</p>
      ) : (
        <>
          <div className="dashboard-stats">

            <div className="stat-card">
              <h3>Total Grievances</h3>
              <p>{cmoGrievances.length}</p>
            </div>

            <div className="stat-card">
              <h3>Pending</h3>
              <p>
                {cmoGrievances.filter(
                  (g) => g.status !== "RESOLVED"
                ).length}
              </p>
            </div>

            <div className="stat-card">
              <h3>Resolved</h3>
              <p>
                {cmoGrievances.filter(
                  (g) => g.status === "RESOLVED"
                ).length}
              </p>
            </div>

            <div className="stat-card">
              <h3>High Priority</h3>
              <p>
                {cmoGrievances.filter(
                  (g) => g.priority === "HIGH"
                ).length}
              </p>
            </div>

          </div>

<div className="cmo-filters">

  <div>
    <label>District</label>
    <select
      value={districtFilter}
      onChange={(e) => setDistrictFilter(e.target.value)}
    >
      <option value="ALL">All Districts</option>
      {[...new Set(cmoGrievances.map(g => g.district))].map(district => (
        <option key={district} value={district}>
          {district}
        </option>
      ))}
    </select>
  </div>

  <div>
    <label>Category</label>
    <select
      value={categoryFilter}
      onChange={(e) => setCategoryFilter(e.target.value)}
    >
      <option value="ALL">All Categories</option>
      {[...new Set(cmoGrievances.map(g => g.category))].map(category => (
        <option key={category} value={category}>
          {category}
        </option>
      ))}
    </select>
  </div>

  <div>
    <label>Priority</label>
    <select
      value={priorityFilter}
      onChange={(e) => setPriorityFilter(e.target.value)}
    >
      <option value="ALL">All Priorities</option>
      <option value="LOW">Low</option>
      <option value="MEDIUM">Medium</option>
      <option value="HIGH">High</option>
    </select>
  </div>

  <div>
    <label>Status</label>
    <select
      value={statusFilter}
      onChange={(e) => setStatusFilter(e.target.value)}
    >
      <option value="ALL">All Statuses</option>
      <option value="SUBMITTED">Submitted</option>
      <option value="UNDER_REVIEW">Under Review</option>
      <option value="IN_PROGRESS">In Progress</option>
      <option value="RESOLVED">Resolved</option>
      <option value="REOPENED">Reopened</option>
    </select>
  </div>

  <button
    type="button"
    className="secondary-btn"
    onClick={() => {
      setDistrictFilter("ALL");
      setCategoryFilter("ALL");
      setPriorityFilter("ALL");
      setStatusFilter("ALL");
    }}
  >
    Clear Filters
  </button>

</div>
{/* CMO Grievance Assignment Form */}
{showAssignmentForm && (
    <div className="grievance-item">

        <h3>Assign Grievance to Department Officer</h3>

        {assignmentError && (
            <p className="error-message">{assignmentError}</p>
        )}

        {assignmentMessage && (
            <p className="success-message">{assignmentMessage}</p>
        )}

        <form onSubmit={handleAssignGrievance}>

            {/* Select Grievance */}
            <label>Select Grievance</label>
            <select
                value={assignmentData.grievance}
                onChange={(e) => setAssignmentData({
                    ...assignmentData,
                    grievance: e.target.value
                })}
                required
            >
                <option value="">Choose Grievance</option>

                {cmoGrievances.map((grievance) => (
                    <option key={grievance.id} value={grievance.id}>
                        {grievance.reference_number} - {grievance.subject}
                    </option>
                ))}
            </select>

            {/* Select Department */}
            <label>Select Department</label>
            <select
                value={assignmentData.department}
                onChange={(e) => setAssignmentData({
                    ...assignmentData,
                    department: e.target.value
                })}
                required
            >
                <option value="">Choose Department</option>

                {departments.map((department) => (
                    <option key={department.id} value={department.id}>
                        {department.name}
                    </option>
                ))}
            </select>

            {/* Select Officer */}
            <label>Select Officer</label>
            <select
                value={assignmentData.officer}
                onChange={(e) => setAssignmentData({
                    ...assignmentData,
                    officer: e.target.value
                })}
                required
            >
                <option value="">Choose Officer</option>

                {officers.map((officer) => (
                    <option key={officer.id} value={officer.id}>
                        {officer.username} ({officer.email})
                    </option>
                ))}
            </select>

            {/* Assignment Remarks */}
            <label>Assignment Remarks</label>
            <textarea
                rows="4"
                placeholder="Enter instructions for the officer"
                value={assignmentData.remarks}
                onChange={(e) => setAssignmentData({
                    ...assignmentData,
                    remarks: e.target.value
                })}
            />

            <button type="submit" disabled={assignmentLoading}>
                {assignmentLoading ? "Assigning..." : "Submit Assignment"}
            </button>

            <button
                type="button"
                className="secondary-btn"
                onClick={() => {
                setShowAssignmentForm(false);
                setAssignmentError("");
                setAssignmentMessage("");
                }}
            >
                Cancel
            </button>

        </form>
    </div>
)}


          <h3>All Grievances</h3>

          {filteredGrievances.length === 0 ? (
            <p>No grievances available.</p>
          ) : (
            filteredGrievances.map((grievance) => ( 
              <div
                className="grievance-item"
                key={grievance.id}
              >
                <h3>{grievance.subject}</h3>

                <p>
                  <strong>Reference:</strong>{" "}
                  {grievance.reference_number}
                </p>

                <p>
                  <strong>District:</strong>{" "}
                  {grievance.district}
                </p>

                <p>
                  <strong>Category:</strong>{" "}
                  {grievance.category}
                </p>

                <p>
                  <strong>Priority:</strong>{" "}
                  {grievance.priority}
                </p>

                <p>
                  <strong>Status:</strong>{" "}
                  {grievance.status}
                </p>
              </div>
            ))
          )}
        </>
      )}

      <button
        className="secondary-btn"
        onClick={handleLoadCmoGrievances}
      >
        Refresh Grievances
      </button>

    </div>
  </section>
)}


{page === "officer" && (
    <section className="auth-section">
        <div className="auth-card tracking-card">
            <h2>Officer Dashboard</h2>
            <p>Welcome, {currentUser?.username}!</p>

            {officerMessage && (
                <p className="success-message">{officerMessage}</p>
            )}

            {officerError && (
                <p className="error-message">{officerError}</p>
            )}

            <button
                className="secondary-btn"
                onClick={handleLoadOfficerGrievances}
            >
                Refresh Assigned Grievances
            </button>

            {officerLoading ? (
                <p>Loading assigned grievances...</p>
            ) : officerGrievances.length === 0 ? (
                <p>No grievances assigned to you yet.</p>
            ) : (
                officerGrievances.map((grievance) => (
                    <div className="grievance-item" key={grievance.id}>
                        <h3>{grievance.subject}</h3>

                        <p><strong>Reference:</strong> {grievance.reference_number}</p>
                        <p><strong>District:</strong> {grievance.district}</p>
                        <p><strong>Category:</strong> {grievance.category}</p>
                        <p><strong>Description:</strong> {grievance.description}</p>
                        <p><strong>Status:</strong> {grievance.status}</p>
                        <p><strong>Priority:</strong> {grievance.priority}</p>

                        <form
                            onSubmit={(e) =>
                                handleOfficerReportSubmit(e, grievance.id)
                            }
                        >
                            <label>Action Taken Report</label>

                            <textarea
                                rows="4"
                                value={officerReports[grievance.id] || ""}
                                onChange={(e) =>
                                    setOfficerReports((previous) => ({
                                        ...previous,
                                        [grievance.id]: e.target.value
                                    }))
                                }
                                placeholder="Describe the investigation and action taken..."
                                required
                            />

                            <button type="submit" disabled={officerLoading}>
                                {officerLoading
                                    ? "Submitting..."
                                    : "Submit Action Report"}
                            </button>
                        </form>
                    </div>
                ))
            )}
        </div>
    </section>
)}

      {/* Footer */}
      <footer className="footer" id="contact">

        <p>CM Kerala – Grievance Redressal Portal</p>

        <p>
          Independent recruitment prototype.
          Not an official government website.
        </p>

        <p>© 2026 CM Kerala Prototype</p>

      </footer>

    </div>
  );
}

export default App;
