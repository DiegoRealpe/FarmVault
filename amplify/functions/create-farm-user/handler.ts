import { env } from "$amplify/env/create-farm-user";

import {
  AdminAddUserToGroupCommand,
  AdminCreateUserCommand,
  AdminGetUserCommand,
  CognitoIdentityProviderClient,
} from "@aws-sdk/client-cognito-identity-provider";

type AppSyncEvent = {
  arguments: {
    email: string;
    temporaryPassword: string;
  };
};

const cognito = new CognitoIdentityProviderClient({});

export const handler = async (event: AppSyncEvent) => {
  const { email, temporaryPassword } = event.arguments;

  if (!email) {
    throw new Error("email is required");
  }

  if (!temporaryPassword) {
    throw new Error("temporaryPassword is required");
  }

  const username = email.trim().toLowerCase();

  const userPoolId = env.AMPLIFY_AUTH_USERPOOL_ID;
  // ||
  // env.AUTH_USERPOOL_ID ||
  // env.USER_POOL_ID;

  if (!userPoolId) {
    throw new Error(
      "User pool id is not available in the function environment."
    );
  }

  await cognito.send(
    new AdminCreateUserCommand({
      UserPoolId: userPoolId,
      Username: username,
      TemporaryPassword: temporaryPassword,
      UserAttributes: [
        { Name: "email", Value: username },
        { Name: "email_verified", Value: "true" },
      ],
      DesiredDeliveryMediums: ["EMAIL"],
    })
  );

  await cognito.send(
    new AdminAddUserToGroupCommand({
      UserPoolId: userPoolId,
      Username: username,
      GroupName: "farmuser",
    })
  );

  const createdUser = await cognito.send(
    new AdminGetUserCommand({
      UserPoolId: userPoolId,
      Username: username,
    })
  );

  const userSub =
    createdUser.UserAttributes?.find((attr) => attr.Name === "sub")
      ?.Value ?? null;

  return {
    success: true,
    username,
    userSub,
    assignedGroup: "farmuser",
  };
};
