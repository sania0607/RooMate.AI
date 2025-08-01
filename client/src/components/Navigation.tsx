import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Heart, 
  Home, 
  Users, 
  MessageCircle, 
  Settings, 
  Shield,
  Menu,
  LogOut
} from "lucide-react";

const navigationItems = [
  { href: "/", label: "Home", icon: Home },
  { href: "/discover", label: "Discover", icon: Heart },
  { href: "/matches", label: "Matches", icon: Users },
  { href: "/messages", label: "Messages", icon: MessageCircle },
  { href: "/profile", label: "Profile", icon: Settings },
];

const adminItems = [
  { href: "/admin", label: "Admin", icon: Shield },
];

export default function Navigation() {
  const [location] = useLocation();
  const { user, isAuthenticated } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      });
      // Redirect to landing page after successful logout
      window.location.href = '/';
    } catch (error) {
      console.error('Logout error:', error);
      // Still redirect to landing page to clear any stale state
      window.location.href = '/';
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  const NavItems = ({ onItemClick }: { onItemClick?: () => void }) => (
    <>
      {navigationItems.map((item) => {
        const Icon = item.icon;
        const isActive = location === item.href;
        
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
              isActive
                ? "bg-primary text-white"
                : "text-gray-600 hover:bg-gray-100 hover:text-primary"
            }`}
            onClick={onItemClick}
          >
            <Icon className="w-5 h-5" />
            <span className="font-medium">{item.label}</span>
          </Link>
        );
      })}
      
      {/* Admin Link - Only show for admin users */}
      {adminItems.map((item) => {
        const Icon = item.icon;
        const isActive = location === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
              isActive
                ? "bg-primary text-white"
                : "text-gray-600 hover:bg-gray-100 hover:text-primary"
            }`}
            onClick={onItemClick}
          >
            <Icon className="w-5 h-5" />
            <span className="font-medium">{item.label}</span>
          </Link>
        );
      })}
    </>
  );

  return (
    <nav className="bg-white shadow-sm border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-primary to-primary-dark rounded-lg flex items-center justify-center">
              <Heart className="text-white w-4 h-4" />
            </div>
            <span className="text-xl font-bold text-gray-900">RooMate.ai</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-2">
            <NavItems />
          </div>

          {/* User Menu */}
          <div className="flex items-center space-x-4">
            {/* User Avatar and Info */}
            <div className="hidden md:flex items-center space-x-3">
              <Avatar className="w-8 h-8">
                <AvatarFallback>
                  {user?.name?.charAt(0)?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="text-sm">
                <div className="font-medium text-gray-900">
                  {user?.name}
                </div>
                <div className="text-gray-500 text-xs">
                  @{user?.username}
                </div>
              </div>
            </div>

            {/* Logout Button */}
            <Button
              onClick={handleLogout}
              variant="outline"
              size="sm"
              className="hidden md:flex items-center space-x-1"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </Button>

            {/* Mobile Menu */}
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="md:hidden">
                  <Menu className="w-4 h-4" />
                </Button>
              </SheetTrigger>
              <SheetContent>
                <div className="flex flex-col space-y-4 mt-8">
                  {/* User Info */}
                  <div className="flex items-center space-x-3 pb-4 border-b">
                    <Avatar className="w-10 h-10">
                      <AvatarFallback>
                        {user?.name?.charAt(0)?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium text-gray-900">
                        {user?.name}
                      </div>
                      <div className="text-gray-500 text-sm">
                        @{user?.username}
                      </div>
                    </div>
                  </div>

                  {/* Navigation Items */}
                  <div className="space-y-2">
                    <NavItems onItemClick={() => setMobileMenuOpen(false)} />
                  </div>

                  {/* Logout */}
                  <div className="pt-4 border-t">
                    <Button
                      onClick={handleLogout}
                      variant="outline"
                      className="w-full flex items-center justify-center space-x-2"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Logout</span>
                    </Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  );
}
