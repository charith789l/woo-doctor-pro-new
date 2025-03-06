
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Clock } from "lucide-react";

const OrderManagement = () => {
  return (
    <DashboardLayout>
      <div className="container mx-auto px-4 py-8">
        <Card className="text-center">
          <CardHeader>
            <CardTitle className="flex items-center justify-center gap-2 text-3xl font-bold text-gray-800 dark:text-white">
              <Clock className="h-8 w-8 text-primary" />
              Coming Soon
            </CardTitle>
          </CardHeader>
          <CardContent className="py-8">
            <p className="text-lg text-gray-600 dark:text-gray-300">
              The Order Management feature is under development. Stay tuned for updates!
            </p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default OrderManagement;
