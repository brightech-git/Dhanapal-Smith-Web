// src/pages/create-smith.tsx
import React from "react";
import SmithDetailsForm from "@/component/pages/smith/SmithDetailsForm";
import ProtectedRoute from "@/component/Layout/ProtectedRoute";

const CreateSmithDetailPage = () => {

    return(
        <ProtectedRoute>
            <SmithDetailsForm />
        </ProtectedRoute>
    ) 
};

export default CreateSmithDetailPage;
