import { Navigate } from "react-router-dom";

const Prot4route = ({ children, allowedRoles }) => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('userRole');

    //not even recognized
    if (!token) {
        return <Navigate to="/login" />;
    }

    //trying to hack
    if (allowedRoles && !allowedRoles.includes(role)) {
        return <Navigate to="/login" />;
    }
    return children;
};

export default Prot4route;