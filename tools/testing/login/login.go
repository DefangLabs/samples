package login

import (
	"context"
	"crypto/ed25519"
	"crypto/x509"
	"encoding/pem"
	"fmt"
	"log"
	"strings"
	"time"

	defangclient "github.com/DefangLabs/defang/src/pkg/cli/client"
	"github.com/DefangLabs/defang/src/pkg/types"
	defangv1 "github.com/DefangLabs/defang/src/protos/io/defang/v1"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/service/ssm"
	"github.com/aws/smithy-go/ptr"
	"github.com/golang-jwt/jwt/v5"
)

type TokenIssuer struct {
	cluster string
	key     ed25519.PrivateKey
}

func NewTokenIssuer(ctx context.Context, cluster string) (*TokenIssuer, error) {
	parts := strings.Split(strings.TrimPrefix(cluster, "fabric-"), ".")
	if len(parts) < 2 {
		return nil, fmt.Errorf("invalid cluster: %v", cluster)
	}
	stack := parts[0]

	config, err := config.LoadDefaultConfig(ctx)
	if err != nil {
		return nil, fmt.Errorf("unable to load SDK config: %w", err)
	}

	ssmClient := ssm.NewFromConfig(config)
	privateKeyParamName := fmt.Sprintf("/ecs/%v/fixed-verifier-private-key-ed25519-pem", stack)
	out, err := ssmClient.GetParameter(ctx, &ssm.GetParameterInput{
		Name:           ptr.String(privateKeyParamName),
		WithDecryption: ptr.Bool(true),
	})
	if err != nil {
		return nil, fmt.Errorf("failed to get fixed verifier key at %v parameter: %w", privateKeyParamName, err)
	}

	pk, err := decodePrivateKeyPEM(*out.Parameter.Value)
	if err != nil {
		return nil, fmt.Errorf("failed to parse fixed verifier key: %w", err)
	}

	return &TokenIssuer{cluster: cluster, key: pk}, nil
}

func (ti *TokenIssuer) Login(ctx context.Context, tenantId types.TenantID) (string, error) {
	authToken := createAuthToken(tenantId, ti.key)

	loginClient := defangclient.NewGrpcClient(ti.cluster, "", types.TenantID(tenantId), nil)
	resp, err := loginClient.Token(ctx, &defangv1.TokenRequest{
		Assertion: authToken,
		Scope:     nil, // Empty scope implies admin
	})
	if err != nil {
		return "", fmt.Errorf("failed to get token: %w", err)
	}
	return resp.AccessToken, nil
}

func decodePrivateKeyPEM(privateKeyPEM string) (ed25519.PrivateKey, error) {
	block, _ := pem.Decode([]byte(privateKeyPEM))
	if block == nil {
		return nil, fmt.Errorf("failed to parse private key: %v", privateKeyPEM)
	}
	key, err := x509.ParsePKCS8PrivateKey(block.Bytes)
	if err != nil {
		return nil, fmt.Errorf("failed to parse private key: %w", err)
	}
	pk, ok := key.(ed25519.PrivateKey)
	if !ok {
		return nil, fmt.Errorf("invalid private key type %T", key)
	}
	return pk, nil
}

func createAuthToken(tenantId types.TenantID, privateKey ed25519.PrivateKey) string {
	claims := jwt.RegisteredClaims{
		Subject:   tenantId.String(),
		Issuer:    "fixed",
		ExpiresAt: jwt.NewNumericDate(time.Now().Add(1 * time.Hour)),
	}
	token := jwt.NewWithClaims(jwt.SigningMethodEdDSA, claims)
	token.Header["kid"] = "fixed"
	// Sign and get the complete encoded token as a string using the key
	tokenString, err := token.SignedString(privateKey)
	if err != nil {
		log.Println("failed to sign token:", err)
	}
	return tokenString
}
