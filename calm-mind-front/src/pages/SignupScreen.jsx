import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { useAuthStore } from "../store/authStore";

export default function SignupScreen() {
  const navigate = useNavigate();
  const { signup, loading: storeLoading, error: storeError } = useAuthStore();

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [formAnimation, setFormAnimation] = useState("animate-swap-in-right");
  const [imageAnimation, setImageAnimation] = useState("animate-swap-in-right");

  const handleChange = (e) => {
    const { id, type, checked, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [id]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSignup = async (e) => {
    e.preventDefault();

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      setError("");
      setLoading(true);

      const ok = await signup({
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.toLowerCase(),
        password: form.password,
      });

      if (!ok) {
        setError(storeError || "Registration failed.");
        return;
      }

      alert("Registration successful! Please log in to continue.");
      navigate("/login");
    } catch (err) {
      console.error("Signup error:", err);
      setError("Registration failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoLogin = () => {
    setFormAnimation("animate-swap-out-right");
    setImageAnimation("animate-swap-out-right");
    setTimeout(() => navigate("/login"), 300);
  };

  return (
    <div className="fixed inset-0 flex w-full overflow-hidden">
      {/* Left image side */}
      <div className={`hidden lg:block lg:w-1/2 min-h-0 ${imageAnimation}`}>
        <img
          src="/signup.png"
          alt="Sign up"
          className="block w-full h-full object-cover"
        />
      </div>

      {/* Right form side */}
      <div
        className={`w-full lg:w-1/2 bg-white p-8 flex items-center justify-center min-h-0 ${formAnimation}`}
      >
        <div className="w-full max-w-md max-h-full overflow-hidden text-left">
          <div className="mb-8">
            <img src="/logo.png" alt="Calm Mind Logo" className="h-12" />
          </div>

          <h1 className="text-3xl font-bold mb-2 text-gray-800">
            Create account.
          </h1>
          <p className="text-gray-600 mb-8">
            Join CalmMind and start your journey.
          </p>

          <form onSubmit={handleSignup} className="space-y-6">
            <div className="flex space-x-4">
              <div className="space-y-1 flex-1">
                <label
                  htmlFor="firstName"
                  className="block text-sm text-gray-600 pl-3"
                >
                  First Name
                </label>
                <input
                  id="firstName"
                  className="w-full p-3 border border-gray-300 rounded-md"
                  placeholder="Enter your first name"
                  type="text"
                  value={form.firstName}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="space-y-1 flex-1">
                <label
                  htmlFor="lastName"
                  className="block text-sm text-gray-600 pl-3"
                >
                  Last Name
                </label>
                <input
                  id="lastName"
                  className="w-full p-3 border border-gray-300 rounded-md"
                  placeholder="Enter your last name"
                  type="text"
                  value={form.lastName}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
              <label
                htmlFor="email"
                className="block text-sm text-gray-600 pl-3"
              >
                Email
              </label>
              <input
                id="email"
                className="w-full p-3 border border-gray-300 rounded-md"
                placeholder="Enter your email"
                type="email"
                value={form.email}
                onChange={handleChange}
                required
              />
            </div>

            <div className="space-y-1">
              <label
                htmlFor="password"
                className="block text-sm text-gray-600 pl-3"
              >
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  className="w-full p-3 border border-gray-300 rounded-md"
                  placeholder="Create a password"
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  onChange={handleChange}
                  required
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            <div className="space-y-1">
              <label
                htmlFor="confirmPassword"
                className="block text-sm text-gray-600 pl-3"
              >
                Confirm Password
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  className="w-full p-3 border border-gray-300 rounded-md"
                  placeholder="Re-enter your password"
                  type={showConfirmPassword ? "text" : "password"}
                  value={form.confirmPassword}
                  onChange={handleChange}
                  required
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            {/* Error display */}
            {(error || storeError) && (
              <p className="text-red-500 text-sm text-center">
                {error || storeError}
              </p>
            )}

            <button
              type="submit"
              className="w-full p-3 bg-black text-white rounded-md hover:bg-gray-800 transition"
            >
              {loading || storeLoading ? "Creating account..." : "Sign Up"}
            </button>
          </form>

          <div className="mt-6 text-center text-sm">
            <p className="text-gray-600">
              Already have an account?
              <button
                className="ml-1 text-yellow-500 hover:underline"
                onClick={handleGoLogin}
              >
                Log in
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
