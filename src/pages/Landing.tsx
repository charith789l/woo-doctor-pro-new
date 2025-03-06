import React, { useState, useEffect, createContext } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowRight,
  CheckCircle2,
  Star,
  Package,
  BarChart3,
  ShoppingCart,
  Zap,
  Sparkles,
  Lock,
  LineChart,
  ShieldCheck,
  RefreshCw,
  MessageSquare,
  Globe,
  ChevronDown,
  Menu,
  X,
} from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import TypewriterComponent from "typewriter-effect";

const DisclosureContext = createContext({
  isOpen: false,
  setIsOpen: (value: boolean) => {},
});

const Landing = () => {
  const navigate = useNavigate();
  const { session } = useAuthStore();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  const slogans = [
    "Boost your WooCommerce sales by 35% in 30 days.",
    "Turn store visitors into loyal customers, effortlessly.",
    "Manage your products in minutes, not hours.",
    "Automate your WooCommerce workflow today.",
    "Scale your online store without the headache."
  ];

  useEffect(() => {
    if (session) {
      navigate("/app/dashboard");
    }
  }, [session, navigate]);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5 },
  };

  const staggerContainer = {
    initial: {},
    animate: {
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-950 transition-colors duration-300">
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? "bg-white/90 dark:bg-gray-900/90 backdrop-blur-md shadow-sm" : "bg-transparent"}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <span className="text-2xl font-bold bg-gradient-to-r from-fuchsia-600 to-pink-600 bg-clip-text text-transparent">
                Woo Doctor
              </span>
              
              <div className="hidden md:flex ml-10 space-x-8">
                <a href="#features" className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white font-medium">Features</a>
                <a href="#pricing" className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white font-medium">Pricing</a>
                <a href="#testimonials" className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white font-medium">Testimonials</a>
                <a href="#faq" className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white font-medium">FAQ</a>
              </div>
            </div>
            
            <div className="hidden md:flex items-center space-x-4">
              <ThemeToggle />
              <Button variant="ghost" onClick={() => navigate("/auth")}>
                Login
              </Button>
              <Button 
                onClick={() => navigate("/auth?tab=signup")}
                className="bg-gradient-to-r from-fuchsia-600 to-pink-600 hover:from-fuchsia-700 hover:to-pink-700 text-white"
              >
                Start Free
              </Button>
            </div>
            
            <div className="flex md:hidden items-center space-x-2">
              <ThemeToggle />
              <Button variant="ghost" size="icon" onClick={() => setIsMenuOpen(!isMenuOpen)}>
                {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </Button>
            </div>
          </div>
        </div>
        
        <div className={`md:hidden transition-all duration-300 ease-in-out ${isMenuOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0 overflow-hidden"}`}>
          <div className="px-4 py-2 space-y-1 bg-white dark:bg-gray-900 shadow-lg">
            <a href="#features" className="block py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 rounded px-3">Features</a>
            <a href="#pricing" className="block py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 rounded px-3">Pricing</a>
            <a href="#testimonials" className="block py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 rounded px-3">Testimonials</a>
            <a href="#faq" className="block py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 rounded px-3">FAQ</a>
            <div className="pt-2 pb-3 border-t border-gray-200 dark:border-gray-700">
              <Button variant="ghost" className="w-full justify-start" onClick={() => navigate("/auth")}>
                Login
              </Button>
              <Button 
                className="w-full mt-2 justify-start bg-gradient-to-r from-fuchsia-600 to-pink-600 hover:from-fuchsia-700 hover:to-pink-700"
                onClick={() => navigate("/auth?tab=signup")}
              >
                Start Free
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <section className="relative pt-32 pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute h-full w-full bg-gradient-to-b from-purple-50/70 via-purple-100/40 to-transparent dark:from-purple-950/10 dark:via-purple-900/5 dark:to-transparent"></div>
        </div>
        
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial="initial"
            animate="animate"
            variants={fadeInUp}
            className="text-center"
          >
            <Badge className="mb-4 bg-fuchsia-100 text-fuchsia-800 dark:bg-fuchsia-900/30 dark:text-fuchsia-300 hover:bg-fuchsia-100 dark:hover:bg-fuchsia-900/30">
              <Sparkles className="mr-1 h-3 w-3" /> New Features Released
            </Badge>
            <h1 className="text-5xl md:text-6xl xl:text-7xl font-bold mb-6 bg-gradient-to-r from-fuchsia-600 to-pink-600 bg-clip-text text-transparent">
              Streamline Your WooCommerce Business
            </h1>
            <div className="text-lg md:text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto h-20">
              <TypewriterComponent
                options={{
                  strings: slogans,
                  autoStart: true,
                  loop: true,
                  delay: 40,
                  deleteSpeed: 30,
                  wrapperClassName: "text-lg md:text-xl font-medium",
                  cursorClassName: "text-fuchsia-600 dark:text-fuchsia-400"
                }}
              />
            </div>
            <div className="flex flex-col sm:flex-row justify-center gap-4 mb-8">
              <Button
                size="lg"
                onClick={() => navigate("/auth?tab=signup")}
                className="bg-gradient-to-r from-fuchsia-600 to-pink-600 hover:from-fuchsia-700 hover:to-pink-700 text-white text-lg py-6 px-8"
              >
                Start Your Free Trial <ArrowRight className="ml-2" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="text-lg border-2 py-6 px-8 dark:border-gray-700 dark:text-white"
              >
                Book a Demo
              </Button>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center justify-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500" /> No credit card required
              <span className="mx-2">•</span>
              <CheckCircle2 className="h-4 w-4 text-green-500" /> 14-day free trial
              <span className="mx-2">•</span>
              <CheckCircle2 className="h-4 w-4 text-green-500" /> Cancel anytime
            </p>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.7 }}
            className="mt-16 relative mx-auto max-w-5xl"
          >
            <div className="rounded-xl overflow-hidden shadow-2xl border border-gray-200 dark:border-gray-800">
              <img 
                src="/images/dasbord.png" 
                alt="WooDoctor Dashboard" 
                className="w-full h-auto"
              />
            </div>
            <div className="absolute -bottom-6 -right-6 bg-gradient-to-r from-fuchsia-600 to-pink-600 text-white py-3 px-6 rounded-lg shadow-lg transform rotate-3">
              <div className="flex items-center gap-2">
                <LineChart className="h-5 w-5" />
                <span className="font-semibold">+127% Sales Growth</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="py-16 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <p className="text-gray-500 dark:text-gray-400 font-medium">Trusted by thousands of businesses worldwide</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8 items-center justify-items-center">
            {["Brand 1", "Brand 2", "Brand 3", "Brand 4", "Brand 5", "Brand 6"].map((brand, i) => (
              <div key={i} className="grayscale opacity-70 hover:grayscale-0 hover:opacity-100 transition-all duration-300">
                <img 
                  src={`https://placehold.co/160x60/ddd/888?text=${brand}`} 
                  alt={brand} 
                  className="h-8 lg:h-10"
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="features" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="initial"
            whileInView="animate"
            variants={fadeInUp}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <Badge className="mb-4 bg-fuchsia-100 text-fuchsia-800 dark:bg-fuchsia-900/30 dark:text-fuchsia-300 hover:bg-fuchsia-100 dark:hover:bg-fuchsia-900/30">
              Powerful Features
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4 dark:text-white">Everything You Need to Scale</h2>
            <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Woo Doctor provides a comprehensive suite of tools designed to help you grow your WooCommerce store efficiently.
            </p>
          </motion.div>
          
          <motion.div 
            initial="initial"
            whileInView="animate"
            variants={staggerContainer}
            viewport={{ once: true }}
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            {[
              {
                icon: Package,
                title: "Intelligent Product Management",
                description:
                  "Manage thousands of products with AI-powered categorization and smart bulk operations that save hours of manual work.",
              },
              {
                icon: ShoppingCart,
                title: "Optimized Order Processing",
                description:
                  "Streamline your fulfillment workflow with automated order routing, smart prioritization, and instant status updates.",
              },
              {
                icon: BarChart3,
                title: "Actionable Analytics",
                description:
                  "Make data-driven decisions with real-time dashboards that highlight opportunities and predict future trends.",
              },
              {
                icon: RefreshCw,
                title: "Automated Syncing",
                description:
                  "Keep your inventory, pricing, and product data in perfect sync across multiple channels without manual intervention.",
              },
              {
                icon: Lock,
                title: "Enterprise-grade Security",
                description:
                  "Rest easy knowing your store data is protected with industry-leading encryption and secure access controls.",
              },
              {
                icon: Zap,
                title: "Lightning Fast Performance",
                description:
                  "Experience blazing-fast operations with our optimized infrastructure designed for high-volume stores.",
              },
            ].map((feature, index) => (
              <motion.div
                key={index}
                variants={fadeInUp}
                className="relative"
              >
                <Card className="h-full transition-all duration-300 hover:shadow-md dark:border-gray-800 hover:border-fuchsia-200 dark:hover:border-fuchsia-900/50">
                  <CardHeader>
                    <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-fuchsia-500/20 to-pink-500/20 dark:from-fuchsia-900/20 dark:to-pink-900/20 flex items-center justify-center mb-4">
                      <feature.icon className="h-6 w-6 text-fuchsia-600 dark:text-fuchsia-400" />
                    </div>
                    <CardTitle className="text-xl font-semibold">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 dark:text-gray-300">{feature.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      <section className="py-20 bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="initial"
            whileInView="animate"
            variants={fadeInUp}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <Badge className="mb-4 bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/30">
              Simple Process
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4 dark:text-white">How Woo Doctor Works</h2>
            <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Get up and running in minutes with our straightforward setup process
            </p>
          </motion.div>
          
          <div className="grid md:grid-cols-3 gap-8 relative">
            <div className="hidden md:block absolute top-24 left-[20%] right-[20%] h-0.5 bg-gradient-to-r from-fuchsia-600 to-pink-600"></div>
            
            {[
              {
                step: "1",
                title: "Connect Your Store",
                description: "Easily connect to your WooCommerce store with our secure, one-click integration.",
              },
              {
                step: "2",
                title: "Import Your Data",
                description: "We'll automatically sync your products, orders, and customer information.",
              },
              {
                step: "3",
                title: "Start Optimizing",
                description: "Use our powerful tools to streamline operations and boost your sales.",
              },
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
                viewport={{ once: true }}
                className="relative"
              >
                <div className="text-center">
                  <div className="relative mx-auto mb-6">
                    <div className="h-12 w-12 rounded-full bg-gradient-to-r from-fuchsia-600 to-pink-600 flex items-center justify-center text-white text-xl font-bold mx-auto z-10 relative">
                      {item.step}
                    </div>
                  </div>
                  <h3 className="text-xl font-bold mb-2 dark:text-white">{item.title}</h3>
                  <p className="text-gray-600 dark:text-gray-300">{item.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-fuchsia-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            {[
              { value: "10,000+", label: "Active Users" },
              { value: "40M+", label: "Products Managed" },
              { value: "99.9%", label: "Uptime" },
              { value: "4.9/5", label: "Customer Rating" },
            ].map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
                viewport={{ once: true }}
                className="text-center"
              >
                <p className="text-4xl lg:text-5xl font-bold mb-2 bg-gradient-to-r from-fuchsia-600 to-pink-600 bg-clip-text text-transparent">
                  {stat.value}
                </p>
                <p className="text-gray-600 dark:text-gray-400 font-medium">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section id="pricing" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="initial"
            whileInView="animate"
            variants={fadeInUp}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <Badge className="mb-4 bg-fuchsia-100 text-fuchsia-800 dark:bg-fuchsia-900/30 dark:text-fuchsia-300 hover:bg-fuchsia-100 dark:hover:bg-fuchsia-900/30">
              Flexible Pricing
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4 dark:text-white">Choose Your Perfect Plan</h2>
            <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Get started with a free trial. No credit card required. Upgrade or downgrade anytime.
            </p>
          </motion.div>
          
          <div className="grid lg:grid-cols-3 gap-8">
            {[
              {
                name: "Starter",
                price: "Free",
                description: "Perfect for small stores just getting started",
                features: [
                  "Basic Product Management",
                  "Up to 100 products",
                  "Standard Analytics",
                  "Email Support",
                  "Community Access",
                ],
                cta: "Get Started",
                mostPopular: false,
              },
              {
                name: "Pro",
                price: "$29",
                description: "Ideal for growing businesses",
                features: [
                  "Advanced Product Management",
                  "Unlimited products",
                  "Bulk Operations & Import",
                  "Advanced Analytics & Reports",
                  "Priority Support",
                  "API Access",
                  "Custom Dashboards",
                ],
                cta: "Start Free Trial",
                mostPopular: true,
              },
              {
                name: "Enterprise",
                price: "Custom",
                description: "Tailored for large-scale operations",
                features: [
                  "All Pro Features",
                  "Dedicated Success Manager",
                  "Custom Integration Development",
                  "White-label Options",
                  "Advanced Security Features",
                  "24/7 Phone Support",
                  "SLA Agreement",
                ],
                cta: "Contact Sales",
                mostPopular: false,
              },
            ].map((plan, index) => (
              <motion.div
                key={index}
                initial="initial"
                whileInView="animate"
                variants={fadeInUp}
                viewport={{ once: true }}
                className="relative"
              >
                <Card className={`h-full transition-all duration-300 ${plan.mostPopular ? 'border-fuchsia-600 dark:border-fuchsia-500 shadow-xl relative z-10 scale-105' : 'hover:shadow-lg border-gray-200 dark:border-gray-800'}`}>
                  {plan.mostPopular && (
                    <div className="absolute -top-4 left-0 right-0 flex justify-center">
                      <Badge className="bg-gradient-to-r from-fuchsia-600 to-pink-600 text-white hover:from-fuchsia-600 hover:to-pink-600">
                        Most Popular
                      </Badge>
                    </div>
                  )}
                  <CardHeader>
                    <CardTitle className="text-2xl">{plan.name}</CardTitle>
                    <div className="mt-4 flex items-baseline">
                      <span className="text-4xl font-extrabold">{plan.price}</span>
                      {plan.price !== "Custom" && <span className="ml-1 text-gray-500 dark:text-gray-400">/month</span>}
                    </div>
                    <CardDescription className="mt-2">{plan.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3">
                      {plan.features.map((feature, i) => (
                        <li key={i} className="flex items-center gap-2">
                          <CheckCircle2 className="h-5 w-5 text-green-500" />
                          <span className="text-gray-700 dark:text-gray-300">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                  <CardFooter>
                    <Button
                      className={`w-full ${
                        plan.mostPopular
                          ? "bg-gradient-to-r from-fuchsia-600 to-pink-600 hover:from-fuchsia-700 hover:to-pink-700 text-white"
                          : "border-2 border-gray-200 dark:border-gray-700"
                      } py-6`}
                      variant={plan.mostPopular ? "default" : "outline"}
                      onClick={() => navigate("/auth?tab=signup")}
                    >
                      {plan.cta}
                    </Button>
                  </CardFooter>
                </Card>
              </motion.div>
            ))}
          </div>
          
          <div className="mt-12 text-center">
            <p className="text-gray-600 dark:text-gray-400">
              All plans include a 14-day free trial. No credit card required.
            </p>
          </div>
        </div>
      </section>

      <section id="testimonials" className="py-20 bg-gray-50 dark:bg-gray-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="initial"
            whileInView="animate"
            variants={fadeInUp}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <Badge className="mb-4 bg-fuchsia-100 text-fuchsia-800 dark:bg-fuchsia-900/30 dark:text-fuchsia-300 hover:bg-fuchsia-100 dark:hover:bg-fuchsia-900/30">
              Customer Success Stories
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4 dark:text-white">What Our Users Say</h2>
            <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Join thousands of satisfied store owners who've transformed their business with Woo Doctor
            </p>
          </motion.div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                name: "Sarah Johnson",
                role: "E-commerce Director",
                company: "Fashion Forward",
                content:
                  "Woo Doctor has completely transformed how we manage our online store. The bulk editing features alone saved us over 20 hours a week of manual work.",
                rating: 5,
                image: "https://placehold.co/200x200/fdf/fef?text=SJ"
              },
              {
                name: "Michael Chen",
                role: "Store Owner",
                company: "Gadget Galaxy",
                content:
                  "The analytics dashboards have given us insights we never had before. We've increased our sales by 37% in just three months by following the AI recommendations.",
                rating: 5,
                image: "https://placehold.co/200x200/fdf/fef?text=MC"
              },
              {
                name: "Emily Rodriguez",
                role: "Operations Manager",
                company: "Health Essentials",
                content:
                  "The customer support team is incredible. They helped us set up custom workflows that perfectly match our unique business needs. I can't imagine running our store without Woo Doctor now.",
                rating: 5,
                image: "https://placehold.co/200x200/fdf/fef?text=ER"
              },
            ].map((testimonial, index) => (
              <motion.div
                key={index}
                initial="initial"
                whileInView="animate"
                variants={fadeInUp}
                viewport={{ once: true }}
                whileHover={{ y: -5 }}
                transition={{ duration: 0.2 }}
              >
                <Card className="h-full dark:border-gray-800">
                  <CardHeader className="pb-0">
                    <div className="flex gap-4 items-center">
                      <div className="h-12 w-12 rounded-full overflow-hidden">
                        <img 
                          src={testimonial.image} 
                          alt={testimonial.name} 
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{testimonial.name}</CardTitle>
                        <CardDescription>{testimonial.role}, {testimonial.company}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="flex gap-1 mb-3">
                      {Array.from({ length: testimonial.rating }).map((_, i) => (
                        <Star
                          key={i}
                          className="w-5 h-5 fill-current text-yellow-400"
                        />
                      ))}
                    </div>
                    <p className="text-gray-600 dark:text-gray-300">{testimonial.content}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section id="faq" className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="initial"
            whileInView="animate"
            variants={fadeInUp}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <Badge className="mb-4 bg-fuchsia-100 text-fuchsia-800 dark:bg-fuchsia-900/30 dark:text-fuchsia-300 hover:bg-fuchsia-100 dark:hover:bg-fuchsia-900/30">
              Common Questions
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4 dark:text-white">Frequently Asked Questions</h2>
            <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Find answers to common questions about Woo Doctor
            </p>
          </motion.div>
          
          <div className="space-y-6">
            {[
              {
                question: "How does the free trial work?",
                answer: "Our 14-day free trial gives you full access to all features with no credit card required. You can upgrade to a paid plan anytime during or after your trial."
              },
              {
                question: "Can I switch plans later?",
                answer: "Absolutely! You can upgrade, downgrade, or cancel your plan at any time. Changes take effect at the start of your next billing cycle."
              },
              {
                question: "Is Woo Doctor secure?",
                answer: "Yes, security is our top priority. We use industry-standard encryption, regular security audits, and strict access controls to keep your data safe."
              },
              {
                question: "How does the WooCommerce integration work?",
                answer: "Our integration uses the WooCommerce REST API to securely connect to your store. It takes just a few clicks to set up with our guided process."
              },
              {
                question: "Do you offer custom features?",
                answer: "Yes, our Enterprise plan includes custom feature development tailored to your specific business needs. Contact our sales team to discuss your requirements."
              },
            ].map((faq, index) => (
              <motion.div 
                key={index}
                initial="initial"
                whileInView="animate"
                variants={fadeInUp}
                viewport={{ once: true }}
                className="border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden"
              >
                <Disclosure>
                  {({ open }) => (
                    <div className={`${open ? 'bg-gray-50 dark:bg-gray-900/50' : 'bg-white dark:bg-gray-900'}`}>
                      <DisclosureButton 
                        className="w-full px-6 py-4 text-left flex justify-between items-center"
                        onClick={() => {}}
                      >
                        <span className="font-medium text-gray-900 dark:text-white">{faq.question}</span>
                        <ChevronDown className={`w-5 h-5 text-gray-500 transition-transform ${open ? 'transform rotate-180' : ''}`} />
                      </DisclosureButton>
                      <DisclosurePanel className="px-6 py-4 text-gray-600 dark:text-gray-300 border-t border-gray-100 dark:border-gray-800">
                        {faq.answer}
                      </DisclosurePanel>
                    </div>
                  )}
                </Disclosure>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-gradient-to-r from-fuchsia-600 to-pink-600 text-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to Transform Your WooCommerce Store?</h2>
            <p className="text-xl mb-8 text-white/90 max-w-3xl mx-auto">
              Join thousands of successful store owners who've boosted their efficiency and sales with Woo Doctor.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Button 
                size="lg" 
                onClick={() => navigate("/auth?tab=signup")}
                className="bg-white text-fuchsia-600 hover:bg-gray-100 hover:text-fuchsia-700 text-lg py-6 px-8"
              >
                Start Your Free Trial
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="border-white text-white hover:bg-white/10 text-lg py-6 px-8"
              >
                Schedule Demo <ArrowRight className="ml-2" />
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      <footer className="bg-gradient-to-b from-gray-900 to-gray-950 text-white py-16 relative overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0 bg-grid-white/[0.2] [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.5))] bg-[size:20px_20px]"></div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
            <div className="md:text-left md:pr-8">
              <h3 className="text-xl font-bold mb-4 bg-gradient-to-r from-fuchsia-400 to-pink-400 bg-clip-text text-transparent inline-block">Woo Doctor</h3>
              <p className="text-gray-400 mb-6">
                The ultimate solution for WooCommerce store management and optimization.
              </p>
              <div className="flex space-x-4 justify-center md:justify-start">
                <a href="#" className="text-gray-400 hover:text-fuchsia-400 transition-colors duration-200">
                  <span className="sr-only">Twitter</span>
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                  </svg>
                </a>
                <a href="#" className="text-gray-400 hover:text-fuchsia-400 transition-colors duration-200">
                  <span className="sr-only">GitHub</span>
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                  </svg>
                </a>
                <a href="#" className="text-gray-400 hover:text-fuchsia-400 transition-colors duration-200">
                  <span className="sr-only">LinkedIn</span>
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path fillRule="evenodd" d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" clipRule="evenodd" />
                  </svg>
                </a>
              </div>
            </div>
            
            <div className="text-center md:text-left mt-8 md:mt-0">
              <h4 className="font-semibold mb-4 text-white">Product</h4>
              <ul className="space-y-3">
                <li>
                  <a href="#features" className="text-gray-400 hover:text-white transition-colors duration-200">
                    Features
                  </a>
                </li>
                <li>
                  <a href="#pricing" className="text-gray-400 hover:text-white transition-colors duration-200">
                    Pricing
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-400 hover:text-white transition-colors duration-200">
                    Case Studies
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-400 hover:text-white transition-colors duration-200">
                    API Documentation
                  </a>
                </li>
              </ul>
            </div>
            
            <div className="text-center md:text-left mt-8 md:mt-0">
              <h4 className="font-semibold mb-4 text-white">Company</h4>
              <ul className="space-y-3">
                <li>
                  <a href="#" className="text-gray-400 hover:text-white transition-colors duration-200">
                    About
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-400 hover:text-white transition-colors duration-200">
                    Blog
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-400 hover:text-white transition-colors duration-200">
                    Careers
                  </a>
                </li>
                <li>
                  <a href="#testimonials" className="text-gray-400 hover:text-white transition-colors duration-200">
                    Testimonials
                  </a>
                </li>
              </ul>
            </div>
            
            <div className="text-center md:text-left mt-8 md:mt-0">
              <h4 className="font-semibold mb-4 text-white">Support</h4>
              <ul className="space-y-3">
                <li>
                  <a href="#faq" className="text-gray-400 hover:text-white transition-colors duration-200">
                    FAQ
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-400 hover:text-white transition-colors duration-200">
                    Contact
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-400 hover:text-white transition-colors duration-200">
                    Help Center
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-400 hover:text-white transition-colors duration-200">
                    Privacy Policy
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-400 hover:text-white transition-colors duration-200">
                    Terms of Service
                  </a>
                </li>
              </ul>
            </div>
          </div>
          
          <div className="mt-12 pt-8 border-t border-gray-800 text-center">
            <div className="flex flex-col md:flex-row items-center justify-center md:justify-between">
              <p className="text-gray-500">&copy; {new Date().getFullYear()} Woo Doctor. All rights reserved.</p>
              <div className="mt-4 md:mt-0 flex space-x-6">
                <a href="#" className="text-gray-400 hover:text-white transition-colors duration-200 text-sm">
                  Privacy Policy
                </a>
                <a href="#" className="text-gray-400 hover:text-white transition-colors duration-200 text-sm">
                  Terms of Service
                </a>
                <a href="#" className="text-gray-400 hover:text-white transition-colors duration-200 text-sm">
                  Cookie Policy
                </a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

const Disclosure = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <DisclosureContext.Provider value={{ isOpen, setIsOpen }}>
      {typeof children === 'function' ? children({ open: isOpen }) : children}
    </DisclosureContext.Provider>
  );
};

const DisclosureButton = ({ children, className, onClick }) => {
  const context = React.useContext(DisclosureContext);
  
  return (
    <button 
      type="button"
      className={className}
      onClick={() => {
        context.setIsOpen(!context.isOpen);
        if (onClick) onClick();
      }}
    >
      {children}
    </button>
  );
};

const DisclosurePanel = ({ children, className }) => {
  const context = React.useContext(DisclosureContext);
  
  if (!context.isOpen) return null;
  
  return (
    <div className={className}>
      {children}
    </div>
  );
};

export default Landing;
