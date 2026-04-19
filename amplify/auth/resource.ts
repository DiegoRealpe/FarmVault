// amplify/auth/resource.ts
import { defineAuth } from "@aws-amplify/backend";
import { createFarmUserFn } from "../functions/create-farm-user/resource";

export const auth = defineAuth({
  loginWith: {
    email: true,
  },
  groups: ["admin", "farmuser"],
  access: (allow) => [
    allow.resource(createFarmUserFn).to([
      "createUser",
      "addUserToGroup",
    ]),
  ],
});
