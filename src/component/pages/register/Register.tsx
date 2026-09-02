"use client";

import React, { useEffect, useState } from "react";
import Table, { TableColumn } from "@/component/ui/table/Table";
import { useAuth } from "@/context/auth/AuthContext";
import { useToast } from "@/context/smith/ToastContext";
import { Box, Button, Switch, FormControlLabel, IconButton, Typography } from "@mui/material";
import { useTheme } from "@/context/theme/ThemeContext";
import { getAllUsers, updateUser, deleteUser, CreateUserService, getUserById } from "@/service/registerService";
import { Trash2, Plus } from "lucide-react";
import EditableCell from "@/component/ui/EditableCell";

interface User {
    sno: number;
    userName: string;
    password: string;
    active: "Y" | "N";
    isNew?: boolean; // for new user row
    admin?:boolean
}

const ADMIN_ID = 5; // admin user id, can't be edited/deleted

const UsersTable = () => {
    const { allDetails } = useAuth();
    const { addToast } = useToast();
    const { responsive } = useTheme();

    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(false);
    const [tableVisible, setTableVisible] = useState(false);

    // Fetch users
    const fetchUsers = async () => {
        try {
            setLoading(true);
            const data = await getAllUsers();
            setUsers(data || []);
            setTableVisible(true);
        } catch (err: any) {
            addToast({ type: "error", title: "Error", message: "Failed to fetch users" });
        } finally {
            setLoading(false);
        }
    };

    
    useEffect(() => {
        if (allDetails?.sno) {
            fetchUsers();
        }
    }, [allDetails?.sno]);
    console.log(users, 'users');
    const isAdmin = users?.find((user: User) => user.admin === true);

    const toggleTable = () => setTableVisible(prev => !prev);

    // Delete user
    const handleDelete = async (user: User) => {
        if (user.admin) return; // can't delete admin
        if (!window.confirm(`Are you sure you want to delete ${user.userName}?`)) return;

        try {
            await deleteUser(user.sno);
            addToast({ type: "success", title: "Deleted", message: "User deleted successfully" });
            await fetchUsers(); // refetch after delete
        } catch (err: any) {
            addToast({ type: "error", title: "Error", message: "Failed to delete user" });
        }
    };


    // Save edited user
    const handleSave = async (sno: number, key: keyof User, value: any) => {
        const user = users.find(u => u.sno === sno);
        if (!user || user.admin === isAdmin) return;  // can't edit admin

        const updatedUser = { ...user, [key]: value };
        setUsers(prev => prev.map(u => u.sno === sno ? updatedUser : u));

        if (user.isNew) return; // don't call API for new row until "Add" is clicked

        try {
            await updateUser(sno, updatedUser.userName, updatedUser.password, updatedUser.active);
            addToast({ type: "success", title: "Updated", message: "User updated successfully" });
            await fetchUsers(); // refetch after update
        } catch (err: any) {
            addToast({ type: "error", title: "Error", message: "Failed to update user" });
        }
    };

    // Add new user row at the end
    const addEmptyRow = () => {
        setUsers(prev => {
            // Find the highest existing sno
            const maxSno = prev.length > 0 ? Math.max(...prev.map(u => u.sno)) : 0;
            const newSno = maxSno + 1; // next available ID

            // Add a new empty user row at the end
            return [
                ...prev,
                { sno: newSno, userName: "", password: "", active: "Y", isNew: true }
            ];
        });
    };



    // Save new user to backend
    const handleAddNewUser = async (user: User) => {
        try {
            const res = await CreateUserService({
                parentUserId: allDetails?.sno!,
                username: user.userName,
                password: user.password,
            });

            addToast({ type: "success", title: "Added", message: "User added successfully" });
            await fetchUsers(); // refetch after add
        } catch (err: any) {
            addToast({ type: "error", title: "Error", message: "Failed to add user" });
        }
    };

    const columns: TableColumn[] = [
        {
            key: "sno",
            label: "User ID",
            render: (_, row: User) => <span>{row.sno}</span>,
        },
        {
            key: "userName",
            label: "Username",
            render: (_, row: User) => (
                row.admin === isAdmin ? (
                    <span>{row.userName}</span> // admin not editable
                ) : (
                    <EditableCell
                        value={row.userName}
                        type="text"
                        onSave={(val) => handleSave(row.sno, "userName", val)}
                    />
                )
            ),
        },
        {
            key: "password",
            label: "Password",
            render: (_, row: User) => {
                // Mask password visually
                const maskedPassword = row.password ? "*".repeat(5) : "";

                return (
                    <EditableCell
                        // Pass actual password value for editing
                        value={row.password}
                        // Pass masked value to display in table before editing
                        displayValue={maskedPassword}
                        // When editing, make input a password field
                        type="password"
                        onSave={(val) => handleSave(row.sno, "password", val)}
                    />
                );
            },
        },
        {
            key: "active",
            label: "Active",
            render: (_, row: User) => (
                row.admin === isAdmin ? (
                    <span>{row.active === "Y" ? "Active" : "Inactive"}</span>
                ) : (
                    <FormControlLabel
                        control={
                            <Switch
                                checked={row.active === "Y"}
                                onChange={(e) => handleSave(row.sno, "active", e.target.checked ? "Y" : "N")}
                            />
                        }
                        label={row.active === "Y" ? "" : ""}
                    />
                )
            ),
        },
        {
            key: "actions",
            label: "Actions",
            render: (_: any, row: User) => (
                <Box sx={{ display: "flex", gap: 1 }}>
                    {row.isNew ? (
                        <Button
                            variant="contained"
                            size="small"
                            disabled={!row.userName || !row.password}
                            onClick={() => handleAddNewUser(row)}
                        >
                            Add
                        </Button>
                    ) : !row.admin ? ( // <-- check admin here
                        <IconButton color="error" onClick={() => handleDelete(row)}>
                            <Trash2 size={18} />
                        </IconButton>
                    ) : null} 
                </Box>
            ),
        },

    ];

    return (
        <Box>
            {/* Header */}
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1  ,gap:{xs:5,md:10}}}>
              <Typography variant="h4" fontWeight="bold"  gutterBottom sx={{fontSize:{xs:'18px' ,md:'22px'}}}>
                    Users Management
                </Typography>
                <Box sx={{ display: "flex", gap: 1 }}>
                    {tableVisible && <IconButton onClick={addEmptyRow} color="primary"><Plus /></IconButton>}
                 
                    <Button variant="outlined" onClick={toggleTable} size="small" >
                        {tableVisible ? "Show Less" : "Show All"}
                    </Button>
                </Box>
            </Box>

            {/* Table */}
            {tableVisible && (
                <Table
                    columns={columns}
                    data={users}
                    striped
                    hoverable
                    compact="auto"
                    className="border border-t-0 w-full"
                    headerClassName="border-b bg-blue-600 text-white dark:bg-blue-800"
                    bodyClassName="border-0"
                    fixedHeight={responsive.isMobile ? "400px" : "500px"}
                    loading={loading}
                />
            )}
        </Box>
    );
};

export default UsersTable;
 