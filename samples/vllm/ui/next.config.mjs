/** @type {import('next').NextConfig} */
const nextConfig = {
    webpack: (config, { isServer }) => {
      // Add .cjs and .cts extensions to resolve
      config.resolve.extensions.push('.cjs', '.cts');
      
      // Add a rule to handle .cjs and .cts files
      config.module.rules.push({
        test: /\.cjs$/,
        type: 'javascript/auto',
      });
  
      // Ensure langchain modules are properly resolved
      config.module.rules.push({
        test: /node_modules\/langchain/,
        resolve: {
          fullySpecified: false,
        },
      });
  
      // Disable the `fullySpecified` option for non-server builds
      if (!isServer) {
        config.resolve.fullySpecified = false;
      }
  
      return config;
    },
    // Optionally disable SWC minifier if issues persist
    swcMinify: false,
  };
  
  export default nextConfig;
  