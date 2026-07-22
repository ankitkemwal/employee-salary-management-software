import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Layout } from "@/components/layout";
import { EmployeeListPage } from "@/pages/employee-list-page";
import { EmployeeDetailPage } from "@/pages/employee-detail-page";
import { EmployeeFormPage } from "@/pages/employee-form-page";
import { DashboardPage } from "@/pages/dashboard-page";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<EmployeeListPage />} />
          <Route path="employees/new" element={<EmployeeFormPage mode="create" />} />
          <Route path="employees/:id" element={<EmployeeDetailPage />} />
          <Route path="employees/:id/edit" element={<EmployeeFormPage mode="edit" />} />
          <Route path="dashboard" element={<DashboardPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
