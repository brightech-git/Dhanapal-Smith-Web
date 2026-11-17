import ProtectedRoute from "@/src/components/app-shell/protected-route";
import SmithTransactionsPage from "@/src/module/smith/component/smith-transactions";

export default function SmithTransactionsRoute() {
    return (
        <ProtectedRoute requiredProject="SMITH">
            <SmithTransactionsPage />
        </ProtectedRoute>
    );
}
