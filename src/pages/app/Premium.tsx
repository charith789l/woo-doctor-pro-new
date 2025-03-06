
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Crown } from "lucide-react";

const Premium = () => {
  return (
    <DashboardLayout>
      <div className="container mx-auto px-4 py-8">
        <Card className="text-center">
          <CardHeader>
            <CardTitle className="flex items-center justify-center gap-2 text-3xl font-bold text-gray-800 dark:text-white">
              <Crown className="h-8 w-8 text-yellow-500" />
              Premium Features Coming Soon
            </CardTitle>
          </CardHeader>
          <CardContent className="py-8">
            <p className="text-lg text-gray-600 dark:text-gray-300 mb-6">
              We're working on something special! Premium features will be available soon.
            </p>
            <Button disabled className="bg-yellow-500 hover:bg-yellow-600">
              <Crown className="mr-2 h-4 w-4" />
              Join Waitlist
            </Button>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Premium;
