import { defineAuth } from "@aws-amplify/backend";

export const auth = defineAuth({
  loginWith: {
    email: true,
  },
  // userAttributes: {
  //   email: { required: true },
  // },
  // groups: ['farmAdmin', 'tempViewer'],
  // access: (allow) => [
  //   allow.resource("grantTempUserAccessFn").to([
  //     "createUser",
  //     "manageGroups",
  //     "addUserToGroup"
  //   ])
  // ]
});
