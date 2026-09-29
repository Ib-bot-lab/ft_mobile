export const sendOTP = async ({ mail, otp }: { mail: string; otp: string }) => {
  if (!mail || !otp) {
    return { success: false, message: "Email and OTP are required" };
  }

  try {
    const response = await fetch(
      "https://mailtrap-g2su.onrender.com/api/send-otp",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          mail: mail,
          otp: otp,
        }),
      },
    );

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        message: data.message || `Server responded with ${response.status}`,
      };
    }

    return {
      success: data.success,
      message: data.message,
    };
  } catch (error: any) {
    console.error("Network or parsing error:", error.message);
    return {
      success: false,
      message: "Network error or server is unreachable",
    };
  }
};

export const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};
