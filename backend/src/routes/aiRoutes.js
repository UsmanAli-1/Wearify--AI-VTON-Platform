router.post("/check-full-body", upload.single("image"), async (req, res) => {
  try {
    const formData = new FormData();

    formData.append("file", req.file.buffer, {
      filename: "image.jpg",
    });

    const response = await axios.post(
      `${process.env.AI_VALIDATION_URL}/check-full-body`,
      formData,
      {
        headers: formData.getHeaders(),
      }
    );

    // 👇 THIS LINE IS STEP 2
    return res.json(response.data);

  } catch (err) {
    return res.status(500).json({
      message: "AI service error",
    });
  }
});