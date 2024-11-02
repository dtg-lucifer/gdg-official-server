import { Hono } from "hono";
import { ApiResponse } from "../../utils/apiResponse.ts";

const registerRouter = new Hono()

registerRouter.post("/", c => {
  return c.json(new ApiResponse(200, {
    message: "Sucessfully registered !"
  }), 200)
})

export { registerRouter }
